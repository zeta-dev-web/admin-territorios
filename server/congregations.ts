'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ── Get all congregations ──

export async function getAllCongregations() {
  try {
    const congregations = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            groups: true,
            territories: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: congregations,
    }
  } catch (error) {
    console.error('Error getting congregations:', error)
    return {
      success: false,
      message: 'Error al obtener congregaciones',
    }
  }
}

// ── Get congregations for select (simple list) ──

export async function getCongregationsForSelect() {
  try {
    const congregations = await prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: congregations,
    }
  } catch (error) {
    console.error('Error getting congregations:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener congregaciones',
    }
  }
}

// ── Create congregation ──

export async function createCongregation(data: { name: string }) {
  const session = await getSession()
  if (!session?.userId) {
    return { success: false, message: 'No autenticado' }
  }

  // Verificar que el usuario es ADMIN
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    return { success: false, message: 'No tienes permisos' }
  }

  try {
    const { name } = data

    if (!name || name.trim().length === 0) {
      return { success: false, message: 'El nombre es requerido' }
    }

    // Verificar que no exista una congregación con el mismo nombre
    const existing = await prisma.tenant.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    })

    if (existing) {
      return { success: false, message: 'Ya existe una congregación con ese nombre' }
    }

    await prisma.tenant.create({
      data: {
        name: name.trim(),
      },
    })

    revalidatePath('/admin/congregations')

    return {
      success: true,
      message: 'Congregación creada correctamente',
    }
  } catch (error) {
    console.error('Error creating congregation:', error)
    return {
      success: false,
      message: 'Error al crear congregación',
    }
  }
}

// ── Update congregation ──

export async function updateCongregation(id: string, data: { name: string }) {
  const session = await getSession()
  if (!session?.userId) {
    return { success: false, message: 'No autenticado' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    return { success: false, message: 'No tienes permisos' }
  }

  try {
    const { name } = data

    if (!name || name.trim().length === 0) {
      return { success: false, message: 'El nombre es requerido' }
    }

    // Verificar que no exista otra congregación con el mismo nombre
    const existing = await prisma.tenant.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
        NOT: {
          id,
        },
      },
    })

    if (existing) {
      return { success: false, message: 'Ya existe una congregación con ese nombre' }
    }

    await prisma.tenant.update({
      where: { id },
      data: {
        name: name.trim(),
      },
    })

    revalidatePath('/admin/congregations')

    return {
      success: true,
      message: 'Congregación actualizada correctamente',
    }
  } catch (error) {
    console.error('Error updating congregation:', error)
    return {
      success: false,
      message: 'Error al actualizar congregación',
    }
  }
}

// ── Delete congregation ──

export async function deleteCongregation(id: string) {
  const session = await getSession()
  if (!session?.userId) {
    return { success: false, message: 'No autenticado' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    return { success: false, message: 'No tienes permisos' }
  }

  try {
    // Verificar que la congregación no tenga usuarios
    const congregation = await prisma.tenant.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    })

    if (!congregation) {
      return { success: false, message: 'Congregación no encontrada' }
    }

    if (congregation._count.users > 0) {
      return {
        success: false,
        message: 'No se puede eliminar una congregación que tiene usuarios asignados',
      }
    }

    await prisma.tenant.delete({
      where: { id },
    })

    revalidatePath('/admin/congregations')

    return {
      success: true,
      message: 'Congregación eliminada correctamente',
    }
  } catch (error) {
    console.error('Error deleting congregation:', error)
    return {
      success: false,
      message: 'Error al eliminar congregación',
    }
  }
}
