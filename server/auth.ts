'use server'

import {
  createSession,
  deleteSession,
  comparePassword,
  isSystemSetup,
  setupAdmin,
  getSession,
} from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendWelcomeEmail, sendPasswordChangedEmail } from '@/lib/resend'

// ── Login ──

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, message: 'Email y contraseña requeridos' }
  }

  // Si el sistema no tiene admin, hacer setup automatico
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
      await createSession(user)
    } catch (setupError) {
      console.error('Error en setup inicial:', setupError)
      return {
        success: false,
        message: 'Error al configurar el sistema. Revisá las variables de entorno.',
      }
    }

    return { success: true, redirect: '/dashboard' }
  }

  // Login normal
  try {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return { success: false, message: 'Credenciales inválidas' }
    }

    const isValid = await comparePassword(password, user.password)

    if (!isValid) {
      return { success: false, message: 'Credenciales inválidas' }
    }

    await createSession({
      id: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role as 'ADMIN' | 'USER',
    })
  } catch (error) {
    console.error('Error en login:', error)
    return { success: false, message: 'Error al iniciar sesión' }
  }

  return { success: true, redirect: '/dashboard' }
}

// ── Logout ──

export async function logout() {
  await deleteSession()
  redirect('/login')
}

// ── Gestion de usuarios (solo ADMIN) ──

export async function getUsers() {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated || session.role !== 'ADMIN') {
      return { success: false, data: [], message: 'No autorizado' }
    }

    // ADMIN puede ver TODOS los usuarios del sistema
    // USER solo ve los de su propio tenant (que es solo él mismo)
    const users = await prisma.user.findMany({
      where: session.role === 'ADMIN' ? {} : { tenantId: session.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        tenantId: true,
        createdAt: true,
        tenant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: users }
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return { success: false, data: [], message: 'Error al obtener usuarios' }
  }
}

export async function createUser(data: {
  email: string
  password: string
  name?: string
  tenantId?: string
}) {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated || session.role !== 'ADMIN') {
      return { success: false, data: null, message: 'No autorizado' }
    }

    if (!data.email || !data.password) {
      return { success: false, data: null, message: 'Email y contraseña requeridos' }
    }

    if (!data.tenantId) {
      return { success: false, data: null, message: 'Debe seleccionar una congregación' }
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return { success: false, data: null, message: 'Ya existe un usuario con ese email' }
    }

    // Verificar que el tenant exista
    const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } })
    if (!tenant) {
      return { success: false, data: null, message: 'La congregación seleccionada no existe' }
    }

    const hashedPw = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPw,
        name: data.name || data.email.split('@')[0],
        role: 'USER',
        tenantId: data.tenantId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    revalidatePath('/admin/users')

    // Enviar email con credenciales (fire & forget — no bloquea si falla)
    sendWelcomeEmail({
      to: data.email,
      name: data.name || data.email.split('@')[0],
      email: data.email,
      password: data.password,
      appUrl: 'https://territoriosapp.duckdns.org',
    }).then((emailResult) => {
      if (!emailResult.success) {
        console.warn(`No se pudo enviar el email a ${data.email}`)
      }
    }).catch((err) => {
      console.error(`Error al enviar email a ${data.email}:`, err)
    })

    return {
      success: true,
      data: user,
      message: `Usuario ${data.email} creado correctamente. Se le enviaron las credenciales por email.`,
    }
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al crear usuario',
    }
  }
}

export async function resetPassword(userId: string) {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated || session.role !== 'ADMIN') {
      return { success: false, message: 'No autorizado' }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, message: 'Usuario no encontrado' }
    }

    if (user.role === 'ADMIN') {
      return { success: false, message: 'No puedes resetear la contraseña del admin' }
    }

    // Generar nueva contraseña segura
    const newPassword = generateSecurePassword()
    const hashedPw = await hashPassword(newPassword)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPw },
    })

    // Enviar email con la nueva credencial
    sendWelcomeEmail({
      to: user.email,
      name: user.name || user.email.split('@')[0],
      email: user.email,
      password: newPassword,
      appUrl: 'https://territoriosapp.duckdns.org',
    }).catch((err) => {
      console.error(`Error al enviar email a ${user.email}:`, err)
    })

    revalidatePath('/admin/users')

    return {
      success: true,
      data: { newPassword },
      message: 'Contraseña reseteada correctamente. Se envió un email al usuario.',
    }
  } catch (error) {
    console.error('Error al resetear contraseña:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al resetear contraseña',
    }
  }
}

/**
 * Obtiene el rol del usuario autenticado.
 */
export async function getCurrentUserRole() {
  const session = await getSession()
  return session?.role || null
}

/**
 * Obtiene la información completa del usuario autenticado (id, email, tenantId, role).
 */
export async function getCurrentUserInfo() {
  const session = await getSession()
  if (!session?.isAuthenticated) return null
  return {
    userId: session.userId,
    email: session.email,
    tenantId: session.tenantId,
    role: session.role,
  }
}

/**
 * Obtiene el nombre de la congregación del usuario autenticado.
 */
export async function getCurrentUserCongregation() {
  const session = await getSession()
  if (!session?.isAuthenticated || !session.tenantId) return null

  try {
    const tenant = await prisma.tenant.findUnique({
      where: { id: session.tenantId },
      select: { name: true },
    })

    return tenant?.name || null
  } catch (error) {
    console.error('Error getting congregation:', error)
    return null
  }
}

/**
 * Genera una contraseña segura de 16 caracteres.
 */
function generateSecurePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&'
  let password = ''
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length]
  }
  return password
}

/**
 * Cambia la contraseña del usuario autenticado.
 * Verifica la contraseña actual antes de cambiarla y envía un email de notificación.
 */
export async function changeOwnPassword(data: {
  currentPassword: string
  newPassword: string
}) {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated) {
      return { success: false, message: 'No autorizado' }
    }

    if (!data.currentPassword || !data.newPassword) {
      return { success: false, message: 'Todos los campos son requeridos' }
    }

    if (data.newPassword.length < 6) {
      return { success: false, message: 'La nueva contraseña debe tener al menos 6 caracteres' }
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } })
    if (!user) {
      return { success: false, message: 'Usuario no encontrado' }
    }

    const isValid = await comparePassword(data.currentPassword, user.password)
    if (!isValid) {
      return { success: false, message: 'La contraseña actual no es correcta' }
    }

    const hashedPw = await hashPassword(data.newPassword)

    await prisma.user.update({
      where: { id: session.userId },
      data: { password: hashedPw },
    })

    // Notificar por email (fire & forget)
    sendPasswordChangedEmail({
      to: user.email,
      name: user.name || user.email.split('@')[0],
      appUrl: 'https://territoriosapp.duckdns.org',
    }).catch((err) => {
      console.error(`Error al enviar notificación de cambio a ${user.email}:`, err)
    })

    return { success: true, message: 'Contraseña actualizada correctamente' }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al cambiar contraseña',
    }
  }
}

// ── API Keys (para IA externa) ──

/**
 * Genera una API key única usando crypto.
 */
function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let key = 'ta_'
  const array = new Uint8Array(48)
  crypto.getRandomValues(array)
  for (let i = 0; i < 48; i++) {
    key += chars[array[i] % chars.length]
  }
  return key
}

/**
 * Obtiene o crea la API key del usuario autenticado.
 */
export async function getOrCreateApiKey() {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated) {
      return { success: false, data: null, message: 'No autorizado' }
    }

    // Buscar si ya tiene una API key activa
    let apiKey = await prisma.apiKey.findFirst({
      where: { userId: session.userId, isActive: true },
    })

    // Si no tiene, crear una
    if (!apiKey) {
      const newKey = generateApiKey()
      apiKey = await prisma.apiKey.create({
        data: {
          key: newKey,
          userId: session.userId,
          tenantId: session.tenantId,
          name: 'default',
        },
      })
    }

    return { success: true, data: apiKey.key }
  } catch (error) {
    console.error('Error al obtener API key:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al obtener API key',
    }
  }
}

/**
 * Regenera la API key del usuario autenticado (invalida la anterior).
 */
export async function regenerateApiKey() {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated) {
      return { success: false, data: null, message: 'No autorizado' }
    }

    // Desactivar keys anteriores
    await prisma.apiKey.updateMany({
      where: { userId: session.userId, isActive: true },
      data: { isActive: false },
    })

    // Crear nueva key
    const newKey = generateApiKey()
    const apiKey = await prisma.apiKey.create({
      data: {
        key: newKey,
        userId: session.userId,
        tenantId: session.tenantId,
        name: 'default',
      },
    })

    return { success: true, data: apiKey.key }
  } catch (error) {
    console.error('Error al regenerar API key:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al regenerar API key',
    }
  }
}

export async function deleteUser(userId: string) {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated || session.role !== 'ADMIN') {
      return { success: false, message: 'No autorizado' }
    }

    if (userId === session.userId) {
      return { success: false, message: 'No puedes eliminar tu propio usuario' }
    }

    await prisma.user.delete({ where: { id: userId } })

    revalidatePath('/admin/users')

    return { success: true, message: 'Usuario eliminado correctamente' }
  } catch (error) {
    console.error('Error al eliminar usuario:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar usuario',
    }
  }
}

export async function updateUser(userId: string, data: {
  name?: string
  email?: string
  tenantId?: string
}) {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated || session.role !== 'ADMIN') {
      return { success: false, message: 'No autorizado' }
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return { success: false, message: 'Usuario no encontrado' }
    }

    if (user.role === 'ADMIN') {
      return { success: false, message: 'No puedes editar un usuario admin' }
    }

    // Si cambió el email, verificar que no exista
    if (data.email && data.email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } })
      if (existing) {
        return { success: false, message: 'Ya existe un usuario con ese email' }
      }
    }

    // Si cambió el tenantId, verificar que exista
    if (data.tenantId && data.tenantId !== user.tenantId) {
      const tenant = await prisma.tenant.findUnique({ where: { id: data.tenantId } })
      if (!tenant) {
        return { success: false, message: 'La congregación seleccionada no existe' }
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    })

    revalidatePath('/admin/users')

    return { success: true, message: 'Usuario actualizado correctamente' }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al actualizar usuario',
    }
  }
}


// ── Accept Terms ──

export async function acceptTerms() {
  const session = await getSession()
  if (!session?.userId) {
    return { success: false, message: 'No autenticado' }
  }

  try {
    await prisma.user.update({
      where: { id: session.userId },
      data: { termsAcceptedAt: new Date() },
    })

    return { success: true }
  } catch (error) {
    console.error('Error accepting terms:', error)
    return { success: false, message: 'Error al aceptar términos' }
  }
}

// ── Check if user has accepted terms ──

export async function hasAcceptedTerms(): Promise<boolean> {
  const session = await getSession()
  if (!session?.userId) {
    return false
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { termsAcceptedAt: true },
    })

    return !!user?.termsAcceptedAt
  } catch (error) {
    console.error('Error checking terms:', error)
    return false
  }
}
