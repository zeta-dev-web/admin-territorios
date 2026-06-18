'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Crea un nuevo conductor
 */
export async function createDriver(data: {
  name: string
  groupId: string
}) {
  try {
    // Verificar que el grupo existe
    const group = await prisma.group.findUnique({
      where: { id: data.groupId },
    })

    if (!group) {
      throw new Error('Grupo no encontrado')
    }

    const driver = await prisma.driver.create({
      data: {
        name: data.name,
        groupId: data.groupId,
      },
      include: {
        group: true,
      },
    })

    revalidatePath('/dashboard')

    return {
      success: true,
      data: driver,
      message: `Conductor "${data.name}" creado correctamente en ${group.name}`,
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
    const skip = (page - 1) * pageSize

    const [drivers, total, activeCount] = await Promise.all([
      prisma.driver.findMany({
        skip,
        take: pageSize,
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
        orderBy: {
          name: 'asc',
        },
      }),
      prisma.driver.count(),
      prisma.driver.count({
        where: {
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
      data: drivers,
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
    const drivers = await prisma.driver.findMany({
      where: {
        groupId,
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
      orderBy: {
        name: 'asc',
      },
    })

    return {
      success: true,
      data: drivers,
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
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
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

    if (!driver) {
      throw new Error('Conductor no encontrado')
    }

    return {
      success: true,
      data: driver,
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
    // Obtener datos actuales del conductor y su grupo
    const currentDriver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        group: true,
      },
    })

    if (!currentDriver) {
      throw new Error('Conductor no encontrado')
    }

    const oldName = currentDriver.name
    const group = currentDriver.group

    // Actualizar el conductor
    const driver = await prisma.driver.update({
      where: { id: driverId },
      data: {
        name,
        groupId,
      },
      include: {
        group: true,
      },
    })

    // Si cambió el nombre, verificar si este conductor era superintendente o auxiliar
    if (oldName !== name) {
      const updates: { superintendent?: string | null; auxiliary?: string | null } = {}

      if (group.superintendent?.toLowerCase() === oldName.toLowerCase()) {
        updates.superintendent = name
      }
      if (group.auxiliary?.toLowerCase() === oldName.toLowerCase()) {
        updates.auxiliary = name
      }

      if (Object.keys(updates).length > 0) {
        await prisma.group.update({
          where: { id: groupId },
          data: updates,
        })
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/admin/drivers')
    revalidatePath('/admin/groups')

    return {
      success: true,
      data: driver,
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
 * Elimina un conductor (solo si no tiene asignaciones)
 */
export async function deleteDriver(driverId: string) {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: driverId },
      include: {
        assignments: true,
      },
    })

    if (!driver) {
      throw new Error('Conductor no encontrado')
    }

    if (driver.assignments.length > 0) {
      throw new Error(
        'No se puede eliminar un conductor que tiene asignaciones'
      )
    }

    await prisma.driver.delete({
      where: { id: driverId },
    })

    revalidatePath('/dashboard')

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
    const drivers = await prisma.driver.findMany({
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
      data: drivers,
    }
  } catch (error) {
    console.error('Error al obtener conductores:', error)
    return {
      success: false,
      data: [],
    }
  }
}
