'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { splitFullName } from '@/lib/name-utils'

// ════════════════════════════════════════════════════════════════
// GRUPOS → los integrantes/conductores provienen de la entidad única
// Publisher. Las respuestas siguen exponiendo `drivers` y `members`
// (derivados) para compatibilidad con la UI existente.
// ════════════════════════════════════════════════════════════════

function fullName(publisher: { firstName: string; lastName: string }): string {
  return `${publisher.firstName} ${publisher.lastName}`.trim()
}

function normalizeName(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Crea (o marca como conductora) una persona dentro del grupo. */
async function ensureGroupPublisher(
  personName: string,
  groupId: string,
  tenantId: string | null
) {
  const normalizedNew = normalizeName(personName)
  const groupPublishers = await prisma.publisher.findMany({
    where: { groupId, tenantId },
  })
  const existing = groupPublishers.find(
    (p) => normalizeName(fullName(p)) === normalizedNew
  )

  if (existing) {
    if (!existing.isConductor) {
      await prisma.publisher.update({
        where: { id: existing.id },
        data: { isConductor: true },
      })
    }
    return existing.id
  }

  const { firstName, lastName } = splitFullName(personName)
  const publisher = await prisma.publisher.create({
    data: {
      firstName: firstName || personName.trim(),
      lastName,
      isConductor: true,
      groupId,
      tenantId,
    },
  })
  return publisher.id
}

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

    // Superintendente y auxiliar se crean una sola vez como publicadores
    // con capacidad de conductor (antes se duplicaban en Driver + Member)
    if (superintendent) {
      await ensureGroupPublisher(superintendent, group.id, tenantId)
    }
    if (auxiliary && auxiliary !== superintendent) {
      await ensureGroupPublisher(auxiliary, group.id, tenantId)
    }

    revalidatePath('/territorios')
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
 * Obtiene todos los grupos con sus conductores y miembros (derivados de Publisher)
 */
export async function getAllGroups() {
  try {
    const tenantId = await getCurrentTenantId()
    const groups = await prisma.group.findMany({
      where: { tenantId },
      include: {
        publishers: {
          include: {
            _count: {
              select: {
                assignments: true,
              },
            },
            personalAssignments: {
              where: {
                isActive: true,
              },
              include: {
                territory: true,
              },
            },
          },
          orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Derivar la forma legacy: drivers (isConductor) y members (todos)
    const data = groups.map((group) => {
      const { publishers, ...groupFields } = group
      return {
        ...groupFields,
        drivers: publishers
          .filter((p) => p.isConductor)
          .map((p) => ({
            id: p.id,
            name: fullName(p),
            groupId: p.groupId,
            _count: p._count,
          })),
        members: publishers.map((p) => ({
          id: p.id,
          name: fullName(p),
          groupId: p.groupId,
          personalAssignments: p.personalAssignments,
        })),
      }
    })

    return {
      success: true,
      data,
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
 * Si el superintendente o auxiliar cambian, se sincroniza la persona
 * correspondiente en Publisher (se crea si no existe, se renombra si ya existe).
 * Si se vacía el campo, la persona existente NO se elimina.
 */
export async function updateGroup(
  groupId: string,
  name: string,
  superintendent?: string,
  auxiliary?: string
) {
  try {
    const tenantId = await getCurrentTenantId()

    const currentGroup = await prisma.group.findFirst({
      where: { id: groupId, tenantId },
      include: {
        publishers: {
          select: { id: true, firstName: true, lastName: true, isConductor: true },
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
    const groupPublishers = currentGroup.publishers

    async function syncRole(oldRoleName: string | null, newRoleName: string | null) {
      if (!oldRoleName && !newRoleName) return

      const searchName = (oldRoleName || newRoleName)!
      const existing = groupPublishers.find(
        (p) => normalizeName(fullName(p)) === normalizeName(searchName)
      )

      if (oldRoleName && newRoleName) {
        const isSameName =
          oldRoleName.toLowerCase() === newRoleName.toLowerCase()

        if (isSameName) {
          if (!existing) await ensureGroupPublisher(newRoleName, groupId, tenantId)
          return
        }

        if (existing) {
          const { firstName, lastName } = splitFullName(newRoleName)
          await prisma.publisher.update({
            where: { id: existing.id },
            data: { firstName, lastName },
          })
        } else {
          await ensureGroupPublisher(newRoleName, groupId, tenantId)
        }
        return
      }

      if (!oldRoleName && newRoleName) {
        if (!existing) await ensureGroupPublisher(newRoleName, groupId, tenantId)
        else if (!existing.isConductor) {
          // El rol requiere capacidad de conductor
          const { id } = existing
          await prisma.publisher.update({ where: { id }, data: { isConductor: true } })
        }
        return
      }

      // oldName tenía valor y newName es null → la persona se conserva
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

    revalidatePath('/territorios')
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
 * Elimina un grupo (solo si no tiene publicadores)
 */
export async function deleteGroup(groupId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const group = await prisma.group.findFirst({
      where: { id: groupId, tenantId },
      include: {
        _count: { select: { publishers: true } },
      },
    })

    if (!group) {
      throw new Error('Grupo no encontrado')
    }

    if (group._count.publishers > 0) {
      throw new Error(
        'No se puede eliminar un grupo que tiene integrantes asignados'
      )
    }

    await prisma.group.delete({
      where: { id: groupId },
    })

    revalidatePath('/territorios')

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
