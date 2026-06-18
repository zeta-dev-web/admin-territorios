'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Crea un nuevo integrante en un grupo
 */
export async function createMember(name: string, groupId: string) {
  try {
    const member = await prisma.member.create({
      data: {
        name,
        groupId,
      },
    })

    revalidatePath('/admin/groups')

    return {
      success: true,
      data: member,
      message: `Integrante "${name}" agregado correctamente`,
    }
  } catch (error) {
    console.error('Error al crear integrante:', error)
    return {
      success: false,
      data: null,
      message: 'Error al crear el integrante',
    }
  }
}

/**
 * Obtiene todos los integrantes de un grupo
 */
export async function getMembersByGroup(groupId: string) {
  try {
    const members = await prisma.member.findMany({
      where: {
        groupId,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: members,
    }
  } catch (error) {
    console.error('Error al obtener integrantes:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener los integrantes',
    }
  }
}

/**
 * Actualiza un integrante
 */
export async function updateMember(memberId: string, name: string, groupId?: string) {
  try {
    const data: { name: string; groupId?: string } = { name }
    
    if (groupId) {
      data.groupId = groupId
    }

    const member = await prisma.member.update({
      where: { id: memberId },
      data,
    })

    revalidatePath('/admin/groups')

    return {
      success: true,
      data: member,
      message: 'Integrante actualizado correctamente',
    }
  } catch (error) {
    console.error('Error al actualizar integrante:', error)
    return {
      success: false,
      data: null,
      message: 'Error al actualizar el integrante',
    }
  }
}

/**
 * Activa o desactiva un integrante como conductor del grupo.
 * Si ya es conductor, lo elimina. Si no, lo crea.
 */
export async function toggleMemberDriver(memberId: string, groupId: string, memberName: string) {
  try {
    // Buscar si ya existe un conductor con ese nombre en el grupo
    const existingDriver = await prisma.driver.findFirst({
      where: {
        groupId,
        name: {
          equals: memberName,
          mode: 'insensitive',
        },
      },
    })

    if (existingDriver) {
      // Ya es conductor → lo eliminamos
      await prisma.driver.delete({ where: { id: existingDriver.id } })
      revalidatePath('/admin/groups')
      revalidatePath('/admin/drivers')
      return {
        success: true,
        wasAdded: false,
        message: `${memberName} ya no es conductor`,
      }
    } else {
      // No es conductor → lo creamos
      await prisma.driver.create({
        data: {
          name: memberName,
          groupId,
        },
      })
      revalidatePath('/admin/groups')
      revalidatePath('/admin/drivers')
      return {
        success: true,
        wasAdded: true,
        message: `${memberName} ahora es conductor`,
      }
    }
  } catch (error) {
    console.error('Error al cambiar estado de conductor:', error)
    return {
      success: false,
      wasAdded: false,
      message: 'Error al cambiar estado de conductor',
    }
  }
}

/**
 * Elimina un integrante
 */
export async function deleteMember(memberId: string) {
  try {
    await prisma.member.delete({
      where: { id: memberId },
    })

    revalidatePath('/admin/groups')

    return {
      success: true,
      message: 'Integrante eliminado correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar integrante:', error)
    return {
      success: false,
      message: 'Error al eliminar el integrante',
    }
  }
}


export async function getAllMembersForSelect() {
  try {
    const members = await prisma.member.findMany({
      select: {
        id: true,
        name: true,
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: members,
    }
  } catch (error) {
    console.error('Error al obtener miembros:', error)
    return {
      success: false,
      data: [],
    }
  }
}
