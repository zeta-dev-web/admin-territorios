import { NextRequest, NextResponse } from 'next/server'
import { actions } from '@/app/api/agent/route'
import {
  authenticateCredentials,
  comparePassword,
  decrypt,
  encrypt,
  hashPassword,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { withTenantContext } from '@/lib/request-context'
import { exportTerritoryHistoryPdf } from '@/server/territoryExport'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MOBILE_AUTH_TYPE = 'mobile'
const ACTIONS_ALLOWED_BEFORE_TERMS = new Set([
  'me',
  'refresh',
  'acceptTerms',
  'changePassword',
  'logout',
])
const SPECIAL_ACTIONS = [
  'login',
  'me',
  'refresh',
  'acceptTerms',
  'changePassword',
  'logout',
  'exportTerritoryHistoryPdf',
]

interface MobileRequest {
  action?: string
  params?: Record<string, unknown>
}

interface MobileUser {
  id: string
  email: string
  name: string | null
  tenantId: string
  role: 'ADMIN' | 'USER'
  termsAcceptedAt: Date | null
  congregationName: string | null
}

interface MobileAuthContext {
  user: MobileUser
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getBearerToken(request: NextRequest): string | null {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return null

  const token = authorization.slice('Bearer '.length).trim()
  return token || null
}

async function getAuthContext(request: NextRequest): Promise<MobileAuthContext | null> {
  const token = getBearerToken(request)
  if (!token) return null

  const session = await decrypt(token)
  if (
    !session?.isAuthenticated ||
    session.authType !== MOBILE_AUTH_TYPE ||
    !session.userId ||
    !session.tenantId
  ) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      tenantId: true,
      role: true,
      termsAcceptedAt: true,
      tenant: { select: { name: true } },
    },
  })

  if (!user || user.tenantId !== session.tenantId) return null

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role as 'ADMIN' | 'USER',
      termsAcceptedAt: user.termsAcceptedAt,
      congregationName: user.tenant.name,
    },
  }
}

async function issueMobileToken(user: MobileUser): Promise<string> {
  return encrypt({
    isAuthenticated: true,
    authType: MOBILE_AUTH_TYPE,
    userId: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  })
}

function publicUser(user: MobileUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    tenantId: user.tenantId,
    congregationName: user.congregationName,
    termsAccepted: Boolean(user.termsAcceptedAt),
  }
}

async function login(params: Record<string, unknown>) {
  const email = typeof params.email === 'string' ? params.email.trim() : ''
  const password = typeof params.password === 'string' ? params.password : ''
  const result = await authenticateCredentials(email, password)

  if (!result.success) {
    return json(
      { success: false, action: 'login', message: result.message },
      401,
    )
  }

  const userRecord = await prisma.user.findUnique({
    where: { id: result.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      tenantId: true,
      role: true,
      termsAcceptedAt: true,
      tenant: { select: { name: true } },
    },
  })

  if (!userRecord) {
    return json(
      { success: false, action: 'login', message: 'Usuario no encontrado' },
      401,
    )
  }

  const user: MobileUser = {
    id: userRecord.id,
    email: userRecord.email,
    name: userRecord.name,
    tenantId: userRecord.tenantId,
    role: userRecord.role as 'ADMIN' | 'USER',
    termsAcceptedAt: userRecord.termsAcceptedAt,
    congregationName: userRecord.tenant.name,
  }

  const token = await issueMobileToken(user)

  return json({
    success: true,
    action: 'login',
    data: {
      token,
      expiresIn: 60 * 60 * 24,
      user: publicUser(user),
    },
  })
}

async function refreshSession(context: MobileAuthContext) {
  const token = await issueMobileToken(context.user)

  return json({
    success: true,
    action: 'refresh',
    data: {
      token,
      expiresIn: 60 * 60 * 24,
      user: publicUser(context.user),
    },
  })
}

async function changePassword(
  context: MobileAuthContext,
  params: Record<string, unknown>,
) {
  const currentPassword = typeof params.currentPassword === 'string'
    ? params.currentPassword
    : ''
  const newPassword = typeof params.newPassword === 'string'
    ? params.newPassword
    : ''

  if (!currentPassword || !newPassword) {
    return json({
      success: false,
      action: 'changePassword',
      message: 'Todos los campos son requeridos',
    }, 400)
  }

  if (newPassword.length < 6) {
    return json({
      success: false,
      action: 'changePassword',
      message: 'La nueva contraseña debe tener al menos 6 caracteres',
    }, 400)
  }

  const user = await prisma.user.findUnique({
    where: { id: context.user.id },
    select: { password: true },
  })

  if (!user || !(await comparePassword(currentPassword, user.password))) {
    return json({
      success: false,
      action: 'changePassword',
      message: 'La contraseña actual no es correcta',
    }, 400)
  }

  await prisma.user.update({
    where: { id: context.user.id },
    data: { password: await hashPassword(newPassword) },
  })

  return json({
    success: true,
    action: 'changePassword',
    message: 'Contraseña actualizada correctamente',
  })
}

async function acceptTerms(context: MobileAuthContext) {
  await prisma.user.update({
    where: { id: context.user.id },
    data: { termsAcceptedAt: new Date() },
  })

  return json({
    success: true,
    action: 'acceptTerms',
    message: 'Términos aceptados correctamente',
  })
}

async function exportHistoryPdf(
  context: MobileAuthContext,
  params: Record<string, unknown>,
) {
  const numericParams = [
    'startNumber',
    'endNumber',
    'fromMonth',
    'fromYear',
    'toMonth',
    'toYear',
  ]
  const values = numericParams.map((key) => Number(params[key]))

  if (values.some((value) => !Number.isInteger(value))) {
    return json({
      success: false,
      action: 'exportTerritoryHistoryPdf',
      message: 'Los parámetros del rango y período deben ser números enteros',
    }, 400)
  }

  const [startNumber, endNumber, fromMonth, fromYear, toMonth, toYear] = values
  const includeActive = params.includeActive === true

  try {
    const result = await withTenantContext(
      context.user.tenantId,
      () => exportTerritoryHistoryPdf(
        startNumber,
        endNumber,
        fromMonth,
        fromYear,
        toMonth,
        toYear,
        includeActive,
      ),
    )

    if (!result.success || !result.data) {
      return json({
        ...result,
        action: 'exportTerritoryHistoryPdf',
      }, 400)
    }

    return new NextResponse(Buffer.from(result.data), {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${result.filename || 'territorios.pdf'}"`,
      },
    })
  } catch (error) {
    console.error('[MOBILE API] Error al exportar historial:', error)
    return json({
      success: false,
      action: 'exportTerritoryHistoryPdf',
      message: error instanceof Error ? error.message : 'Error al generar el PDF',
    }, 500)
  }
}

export async function GET() {
  return json({
    success: true,
    name: 'Territorios App Mobile API',
    version: '1.0',
    authentication: {
      login: 'POST /api/mobile con action=login',
      bearer: 'Authorization: Bearer <token>',
      expiresIn: '24h',
    },
    actions: [...new Set([...Object.keys(actions), ...SPECIAL_ACTIONS])].sort(),
  })
}

export async function POST(request: NextRequest) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return json({
      success: false,
      message: 'Body inválido: se espera JSON',
    }, 400)
  }

  if (!isRecord(body)) {
    return json({
      success: false,
      message: 'El body debe ser un objeto JSON',
    }, 400)
  }

  const mobileRequest = body as MobileRequest
  const action = mobileRequest.action
  const params = mobileRequest.params ?? {}

  if (!action || typeof action !== 'string') {
    return json({
      success: false,
      message: 'Campo "action" requerido (string)',
    }, 400)
  }

  if (!isRecord(params)) {
    return json({
      success: false,
      action,
      message: 'El campo "params" debe ser un objeto JSON',
    }, 400)
  }

  if (action === 'login') return login(params)

  const context = await getAuthContext(request)
  if (!context) {
    return json({
      success: false,
      action,
      message: 'Sesión móvil inválida o expirada',
    }, 401)
  }

  if (
    !context.user.termsAcceptedAt &&
    !ACTIONS_ALLOWED_BEFORE_TERMS.has(action)
  ) {
    return json({
      success: false,
      action,
      code: 'TERMS_NOT_ACCEPTED',
      message: 'Debés aceptar los términos y condiciones antes de continuar',
    }, 403)
  }

  if (action === 'refresh') return refreshSession(context)

  if (action === 'me') {
    return json({
      success: true,
      action,
      data: { user: publicUser(context.user) },
    })
  }

  if (action === 'acceptTerms') return acceptTerms(context)

  if (action === 'changePassword') {
    return changePassword(context, params)
  }

  if (action === 'exportTerritoryHistoryPdf') {
    return exportHistoryPdf(context, params)
  }

  if (action === 'logout') {
    return json({
      success: true,
      action,
      message: 'Sesión cerrada. Eliminá el token almacenado en la aplicación.',
    })
  }

  const handler = actions[action]
  if (!handler) {
    return json({
      success: false,
      action,
      message: `Acción "${action}" no encontrada`,
      availableActions: [...new Set([...Object.keys(actions), ...SPECIAL_ACTIONS])].sort(),
    }, 404)
  }

  try {
    const result = await withTenantContext(
      context.user.tenantId,
      () => handler(params),
    )

    if (result && typeof result === 'object' && 'success' in result) {
      return json({ ...(result as Record<string, unknown>), action })
    }

    return json({ success: true, action, data: result })
  } catch (error) {
    console.error(`[MOBILE API] Error en "${action}":`, error)
    return json({
      success: false,
      action,
      message: error instanceof Error ? error.message : 'Error desconocido',
    }, 500)
  }
}
