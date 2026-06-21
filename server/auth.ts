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

    redirect('/dashboard')
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

  redirect('/dashboard')
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

    const users = await prisma.user.findMany({
      where: { tenantId: session.tenantId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
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
}) {
  try {
    const session = await getSession()
    if (!session?.isAuthenticated || session.role !== 'ADMIN') {
      return { success: false, data: null, message: 'No autorizado' }
    }

    if (!data.email || !data.password) {
      return { success: false, data: null, message: 'Email y contraseña requeridos' }
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return { success: false, data: null, message: 'Ya existe un usuario con ese email' }
    }

    const hashedPw = await hashPassword(data.password)

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashedPw,
        name: data.name || data.email.split('@')[0],
        role: 'USER',
        tenantId: session.tenantId,
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

    return {
      success: true,
      data: user,
      message: `Usuario ${data.email} creado correctamente`,
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
