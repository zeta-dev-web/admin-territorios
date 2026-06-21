'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'

/**
 * Crea un nuevo grupo
 */
export async function createGroup(
  name: string,
  superintendent?: string,
  auxiliary?: string
) {
  try {
    const tenantId = await getCurrentTenantId()

    const group = await prisma.group.create({
      data: {
        name,
        superintendent: superintendent || null,
        auxiliary: auxiliary || null,
        tenantId,
      },
    })

    // Crear conductores e integrantes automáticamente para superintendente y auxiliar
    const driversToCreate: Array<{ name: string; groupId: string; tenantId: string }> = []
    const membersToCreate: Array<{ name: string; groupId: string; tenantId: string }> = []

    if (superintendent) {
      driversToCreate.push({ name: superintendent, groupId: group.id, tenantId })
      membersToCreate.push({ name: superintendent, groupId: group.id, tenantId })
    }

    if (auxiliary) {
      driversToCreate.push({ name: auxiliary, groupId: group.id, tenantId })
      membersToCreate.push({ name: auxiliary, groupId: group.id, tenantId })
    }

    await Promise.all([
      driversToCreate.length > 0 ? prisma.driver.createMany({ data: driversToCreate }) : Promise.resolve(),
      membersToCreate.length > 0 ? prisma.member.createMany({ data: membersToCreate }) : Promise.resolve(),
    ])

    revalidatePath('/dashboard')
    revalidatePath('/admin/groups')
    revalidatePath('/admin/drivers')

    return {
      success: true,
      data: group,
      message: `Grupo "${name}" creado correctamente`,
    }
  } catch (error) {
    console.error('Error al crear grupo:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al crear el grupo',
    }
  }
}

/**
 * Obtiene todos los grupos con sus conductores y miembros
 */
export async function getAllGroups() {
  try {
    const tenantId = await getCurrentTenantId()
    const groups = await prisma.group.findMany({
      where: { tenantId },
      include: {
        drivers: {
          include: {
            _count: {
              select: {
                assignments: true,
              },
            },
          },
        },
        members: {
          include: {
            personalAssignments: {
              where: {
                isActive: true,
              },
              include: {
                territory: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: groups,
    }
  } catch (error) {
    console.error('Error al obtener grupos:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener los grupos',
    }
  }
}

/**
 * Actualiza un grupo
 * 
 * Si el superintendente o auxiliar cambian, también se actualiza
 * el conductor correspondiente (se crea si no existe, se renombra si ya existe).
 * Si se vacía el campo, el conductor existente NO se elimina.
 */
export async function updateGroup(
  groupId: string,
  name: string,
  superintendent?: string,
  auxiliary?: string
) {
  try {
    const tenantId = await getCurrentTenantId()

    // Obtener el grupo actual para comparar valores viejos
    const currentGroup = await prisma.group.findFirst({
      where: { id: groupId, tenantId },
      include: {
        drivers: {
          select: { id: true, name: true },
        },
      },
    })

    if (!currentGroup) {
      throw new Error('Grupo no encontrado')
    }

    const oldSuperintendent = currentGroup.superintendent
    const oldAuxiliary = currentGroup.auxiliary
    const newSuperintendent = superintendent || null
    const newAuxiliary = auxiliary || null
    const groupDrivers = currentGroup.drivers
    const groupMembers = await prisma.member.findMany({
      where: { groupId },
      select: { id: true, name: true },
    })

    // Función auxiliar: sincroniza un rol con su conductor Y su integrante
    async function syncRole(
      oldName: string | null,
      newName: string | null
    ) {
      if (!oldName && !newName) return

      // Buscar registros existentes (por nombre viejo si cambió, o por el nombre actual)
      const searchName = (oldName || newName)!
      const existingDriver = groupDrivers.find(
        (d) => d.name.toLowerCase() === searchName.toLowerCase()
      )
      const existingMember = groupMembers.find(
        (m) => m.name.toLowerCase() === searchName.toLowerCase()
      )

      if (oldName && newName) {
        // Mismo nombre → verificar que existan los registros, si no, crearlos
        // Nombre diferente → actualizar
        const isSameName = oldName.toLowerCase() === newName.toLowerCase()

        if (isSameName) {
          // Mismo nombre: solo crear lo que falte
          await Promise.all([
            existingDriver
              ? Promise.resolve()
              : prisma.driver.create({ data: { name: newName, groupId, tenantId } }),
            existingMember
              ? Promise.resolve()
              : prisma.member.create({ data: { name: newName, groupId, tenantId } }),
          ])
        } else {
          // Nombre diferente: actualizar existentes o crear si no hay
          await Promise.all([
            existingDriver
              ? prisma.driver.update({ where: { id: existingDriver.id }, data: { name: newName } })
              : prisma.driver.create({ data: { name: newName, groupId, tenantId } }),
            existingMember
              ? prisma.member.update({ where: { id: existingMember.id }, data: { name: newName } })
              : prisma.member.create({ data: { name: newName, groupId, tenantId } }),
          ])
        }
        return
      }

      if (!oldName && newName) {
        // Se agregó → crear si no existen
        await Promise.all([
          existingDriver
            ? Promise.resolve()
            : prisma.driver.create({ data: { name: newName, groupId, tenantId } }),
          existingMember
            ? Promise.resolve()
            : prisma.member.create({ data: { name: newName, groupId, tenantId } }),
        ])
        return
      }

      // Si oldName tenía valor y newName es null → no eliminamos, se conservan
    }

    await Promise.all([
      syncRole(oldSuperintendent, newSuperintendent),
      syncRole(oldAuxiliary, newAuxiliary),
    ])

    // Actualizar el grupo
    const group = await prisma.group.update({
      where: { id: groupId },
      data: {
        name,
        superintendent: newSuperintendent,
        auxiliary: newAuxiliary,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/admin/groups')
    revalidatePath('/admin/drivers')

    return {
      success: true,
      data: group,
      message: 'Grupo actualizado correctamente',
    }
  } catch (error) {
    console.error('Error al actualizar grupo:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al actualizar el grupo',
    }
  }
}

/**
 * Elimina un grupo (solo si no tiene conductores ni miembros)
 */
export async function deleteGroup(groupId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const group = await prisma.group.findFirst({
      where: { id: groupId, tenantId },
      include: {
        drivers: true,
        members: true,
      },
    })

    if (!group) {
      throw new Error('Grupo no encontrado')
    }

    if (group.drivers.length > 0) {
      throw new Error(
        'No se puede eliminar un grupo que tiene conductores asignados'
      )
    }

    if (group.members.length > 0) {
      throw new Error(
        'No se puede eliminar un grupo que tiene integrantes asignados'
      )
    }

    await prisma.group.delete({
      where: { id: groupId },
    })

    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Grupo eliminado correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar grupo:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Error al eliminar el grupo',
    }
  }
}
