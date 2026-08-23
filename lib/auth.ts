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

// ── Admin Backup (para impersonación) ──

/**
 * Guarda la sesión del admin actual como backup antes de impersonar.
 */
export async function saveAdminBackup(session: SessionData) {
  const cookieStore = await cookies()
  const isHttps = process.env.NEXTAUTH_URL?.startsWith('https')

  const backupToken = await encrypt(session)
  cookieStore.set('admin_backup', backupToken, {
    httpOnly: true,
    secure: isHttps || false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 horas
    path: '/',
  })
}

/**
 * Recupera la sesión del admin guardada como backup.
 */
export async function getAdminBackup(): Promise<SessionData | null> {
  const cookieStore = await cookies()
  const backup = cookieStore.get('admin_backup')?.value
  if (!backup) return null
  return await decrypt(backup)
}

/**
 * Elimina el backup de la sesión del admin.
 */
export async function clearAdminBackup() {
  const cookieStore = await cookies()
  cookieStore.delete('admin_backup')
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

export interface AuthenticatedUser {
  id: string
  email: string
  name: string | null
  tenantId: string
  role: 'ADMIN' | 'USER'
}

export type AuthenticationResult =
  | { success: true; user: AuthenticatedUser }
  | { success: false; message: string }

/**
 * Valida credenciales sin depender de cookies.
 * La usan tanto el login web como el login de la API móvil.
 */
export async function authenticateCredentials(
  email: string,
  password: string,
): Promise<AuthenticationResult> {
  if (!email || !password) {
    return { success: false, message: 'Email y contraseña requeridos' }
  }

  if (!(await isSystemSetup())) {
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminEmail || !adminPassword) {
      return {
        success: false,
        message: 'El sistema no está configurado. Configurá ADMIN_EMAIL y ADMIN_PASSWORD en el .env',
      }
    }

    if (email !== adminEmail || password !== adminPassword) {
      return { success: false, message: 'Credenciales inválidas' }
    }

    try {
      const { user } = await setupAdmin()
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: 'Administrador',
          tenantId: user.tenantId,
          role: user.role,
        },
      }
    } catch (error) {
      console.error('Error en setup inicial:', error)
      return {
        success: false,
        message: 'Error al configurar el sistema. Revisá las variables de entorno.',
      }
    }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        tenantId: true,
        role: true,
      },
    })

    if (!user || !(await comparePassword(password, user.password))) {
      return { success: false, message: 'Credenciales inválidas' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenantId,
        role: user.role as 'ADMIN' | 'USER',
      },
    }
  } catch (error) {
    console.error('Error al autenticar usuario:', error)
    return { success: false, message: 'Error al iniciar sesión' }
  }
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
    prisma.publisher.updateMany({ where: { tenantId: null }, data: { tenantId: tenant.id } }),
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
