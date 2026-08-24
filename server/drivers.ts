'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { splitFullName } from '@/lib/name-utils'

// ════════════════════════════════════════════════════════════════
// CONDUCTORES → ahora es una capacidad (`isConductor`) del Publisher,
// no una entidad aparte. Una persona se crea una sola vez (Fase 4.5).
// Las firmas y formas de respuesta se conservan para compatibilidad
// con web y API mobile.
// ════════════════════════════════════════════════════════════════

function fullName(publisher: { firstName: string; lastName: string }): string {
  return `${publisher.firstName} ${publisher.lastName}`.trim()
}

function withName<T extends { firstName: string; lastName: string }>(publisher: T) {
  return { ...publisher, name: fullName(publisher) }
}

function normalizeName(value: string): string {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Crea un nuevo conductor.
 * Si ya existe una persona con ese nombre en el grupo, simplemente se
 * marca como conductora en lugar de duplicarla.
 */
export async function createDriver(data: {
  name: string
  groupId: string
}) {
  try {
    const tenantId = await getCurrentTenantId()

    // Verificar que el grupo existe
    const group = await prisma.group.findUnique({
      where: { id: data.groupId },
    })

    if (!group) {
      throw new Error('Grupo no encontrado')
    }

    const { firstName, lastName } = splitFullName(data.name)
    const normalizedNew = normalizeName(data.name)

    // Buscar persona existente en el mismo grupo (comparación normalizada)
    const groupPublishers = await prisma.publisher.findMany({
      where: { groupId: data.groupId, tenantId },
    })
    const existing = groupPublishers.find(
      (p) => normalizeName(fullName(p)) === normalizedNew
    )

    let publisher
    if (existing) {
      publisher = await prisma.publisher.update({
        where: { id: existing.id },
        data: { isConductor: true },
        include: { group: true },
      })
    } else {
      publisher = await prisma.publisher.create({
        data: {
          firstName,
          lastName,
          isConductor: true,
          groupId: data.groupId,
          tenantId,
        },
        include: { group: true },
      })
    }

    revalidatePath('/territorios')
    revalidatePath('/admin/drivers')
    revalidatePath('/admin/groups')

    return {
      success: true,
      data: withName(publisher),
      message: `Conductor "${fullName(publisher)}" guardado correctamente en ${group.name}`,
    }
  } catch (error) {
    console.error('Error al crear conductor:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al crear el conductor',
    }
  }
}

/**
 * Obtiene todos los conductores con paginación
 */
export async function getAllDrivers(page = 1, pageSize = 10) {
  try {
    const tenantId = await getCurrentTenantId()
    const skip = (page - 1) * pageSize

    const [publishers, total, activeCount] = await Promise.all([
      prisma.publisher.findMany({
        skip,
        take: pageSize,
        where: { tenantId, isConductor: true },
        include: {
          group: true,
          assignments: {
            select: {
              id: true,
              isCompleted: true,
              territory: {
                select: {
                  number: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
              dailyRecords: true,
            },
          },
        },
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      }),
      prisma.publisher.count({ where: { tenantId, isConductor: true } }),
      prisma.publisher.count({
        where: {
          tenantId,
          isConductor: true,
          assignments: {
            some: {
              isCompleted: false,
            },
          },
        },
      }),
    ])

    return {
      success: true,
      data: publishers.map(withName),
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      driversWithActiveAssignments: activeCount,
    }
  } catch (error) {
    console.error('Error al obtener conductores:', error)
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      driversWithActiveAssignments: 0,
      message: 'Error al obtener los conductores',
    }
  }
}

/**
 * Obtiene conductores por grupo
 */
export async function getDriversByGroup(groupId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const publishers = await prisma.publisher.findMany({
      where: {
        groupId,
        tenantId,
        isConductor: true,
      },
      include: {
        group: true,
        _count: {
          select: {
            assignments: true,
            dailyRecords: true,
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return {
      success: true,
      data: publishers.map(withName),
    }
  } catch (error) {
    console.error('Error al obtener conductores del grupo:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener los conductores',
    }
  }
}

/**
 * Obtiene un conductor específico con sus asignaciones
 */
export async function getDriverById(driverId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const publisher = await prisma.publisher.findFirst({
      where: { id: driverId, tenantId, isConductor: true },
      include: {
        group: true,
        assignments: {
          include: {
            territory: true,
            blocks: true,
            dailyRecords: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        },
        dailyRecords: {
          include: {
            block: true,
            assignment: {
              include: {
                territory: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
          take: 50,
        },
      },
    })

    if (!publisher) {
      throw new Error('Conductor no encontrado')
    }

    return {
      success: true,
      data: withName(publisher),
    }
  } catch (error) {
    console.error('Error al obtener conductor:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al obtener el conductor',
    }
  }
}

/**
 * Actualiza un conductor
 * Si el conductor es el superintendente o auxiliar del grupo,
 * también actualiza el nombre correspondiente en el grupo.
 */
export async function updateDriver(
  driverId: string,
  name: string,
  groupId: string
) {
  try {
    const tenantId = await getCurrentTenantId()

    // Obtener datos actuales del conductor y su grupo
    const currentPublisher = await prisma.publisher.findFirst({
      where: { id: driverId, tenantId, isConductor: true },
      include: {
        group: true,
      },
    })

    if (!currentPublisher) {
      throw new Error('Conductor no encontrado')
    }

    const oldName = fullName(currentPublisher)
    const group = currentPublisher.group
    const { firstName, lastName } = splitFullName(name)

    // Actualizar al publicador
    const publisher = await prisma.publisher.update({
      where: { id: driverId },
      data: {
        firstName,
        lastName,
        groupId,
      },
      include: {
        group: true,
      },
    })

    // Sincronizar superintendente/auxiliar si coincidía el nombre anterior
    if (oldName !== name) {
      const updates: { superintendent?: string | null; auxiliary?: string | null } = {}

      if (group?.superintendent?.toLowerCase() === oldName.toLowerCase()) {
        updates.superintendent = name
      }
      if (group?.auxiliary?.toLowerCase() === oldName.toLowerCase()) {
        updates.auxiliary = name
      }

      if (Object.keys(updates).length > 0) {
        await prisma.group.update({
          where: { id: groupId },
          data: updates,
        })
      }
    }

    revalidatePath('/territorios')
    revalidatePath('/admin/drivers')
    revalidatePath('/admin/groups')

    return {
      success: true,
      data: withName(publisher),
      message: 'Conductor actualizado correctamente',
    }
  } catch (error) {
    console.error('Error al actualizar conductor:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al actualizar el conductor',
    }
  }
}

/**
 * Quita el rol de conductor (la persona NO se elimina del directorio).
 * Solo es posible si no tiene asignaciones activas o históricas.
 */
export async function deleteDriver(driverId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const publisher = await prisma.publisher.findFirst({
      where: { id: driverId, tenantId, isConductor: true },
      include: {
        assignments: true,
      },
    })

    if (!publisher) {
      throw new Error('Conductor no encontrado')
    }

    if (publisher.assignments.length > 0) {
      throw new Error(
        'No se puede eliminar un conductor que tiene asignaciones'
      )
    }

    await prisma.publisher.update({
      where: { id: driverId },
      data: { isConductor: false },
    })

    revalidatePath('/territorios')
    revalidatePath('/admin/drivers')
    revalidatePath('/admin/groups')

    return {
      success: true,
      message: 'Conductor eliminado correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar conductor:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Error al eliminar el conductor',
    }
  }
}

export async function getAllDriversForSelect() {
  try {
    const tenantId = await getCurrentTenantId()
    const publishers = await prisma.publisher.findMany({
      where: { tenantId, isConductor: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return {
      success: true,
      data: publishers.map((p) => ({
        id: p.id,
        name: fullName(p),
        group: p.group,
      })),
    }
  } catch (error) {
    console.error('Error al obtener conductores:', error)
    return {
      success: false,
      data: [],
    }
  }
}
