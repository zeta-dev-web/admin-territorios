import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tu-secreto-super-seguro-cambialo'
)

export interface SessionData {
  isAuthenticated: boolean
  userId: string
  email: string
  tenantId: string
  role: 'ADMIN' | 'USER'
  [key: string]: unknown
}

// ── JWT ──

export async function encrypt(payload: SessionData): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(SECRET_KEY)
}

export async function decrypt(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY)
    return payload as unknown as SessionData
  } catch {
    return null
  }
}

// ── Session ──

export async function createSession(user: {
  id: string
  email: string
  tenantId: string
  role: 'ADMIN' | 'USER'
}) {
  const session = await encrypt({
    isAuthenticated: true,
    userId: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  })
  const cookieStore = await cookies()

  const isHttps = process.env.NEXTAUTH_URL?.startsWith('https')

  cookieStore.set('session', session, {
    httpOnly: true,
    secure: isHttps || false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  })
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  return await decrypt(session)
}

export async function deleteSession() {
  const cookieStore = await cookies()
  cookieStore.delete('session')
}

// ── Password ──

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

// ── Admin setup (automatico en primer login) ──

/**
 * Verifica si existe al menos un usuario ADMIN en el sistema.
 */
export async function isSystemSetup(): Promise<boolean> {
  const count = await prisma.user.count({ where: { role: 'ADMIN' } })
  return count > 0
}

/**
 * Crea el tenant y usuario ADMIN por primera vez usando las variables de entorno.
 * Backfillea todos los datos existentes (sin tenantId) con el nuevo tenant.
 */
export async function setupAdmin(): Promise<{
  user: { id: string; email: string; tenantId: string; role: 'ADMIN' | 'USER' }
}> {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminEmail || !adminPassword) {
    throw new Error(
      'Faltan las variables de entorno ADMIN_EMAIL y ADMIN_PASSWORD'
    )
  }

  // Crear tenant
  const tenant = await prisma.tenant.create({
    data: {
      name: 'Administración',
    },
  })

  // Crear usuario admin
  const hashedPw = await hashPassword(adminPassword)
  const user = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPw,
      name: 'Administrador',
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  })

  // Backfillear datos existentes (sin tenantId) a este tenant
  await Promise.all([
    prisma.group.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.driver.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.member.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.territory.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.block.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.assignment.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.dailyRecord.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.personalAssignment.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
    prisma.territoryMap.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
  ])

  return { user: { id: user.id, email: user.email, tenantId: tenant.id, role: user.role as 'ADMIN' | 'USER' } }
}

// ── Query helpers ──

/**
 * Ejecuta un callback con el tenantId del usuario autenticado.
 * Si el callback recibe el tenantId como primer argumento, se lo pasa.
 */
export async function withTenant<T>(
  fn: (tenantId: string) => Promise<T>
): Promise<T> {
  const tenantId = await (await import('./tenant')).getCurrentTenantId()
  return fn(tenantId)
}
