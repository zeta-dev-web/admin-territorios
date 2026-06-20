'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Crea un nuevo territorio
 */
export async function createTerritory(
  number: number,
  groupId: string,
  description?: string,
  blockLetters?: string[]
) {
  try {
    // Verificar que no exista un territorio con ese número
    const existingTerritory = await prisma.territory.findUnique({
      where: { number },
    })

    if (existingTerritory) {
      throw new Error(`Ya existe un territorio con el número ${number}`)
    }

    // Verificar que el grupo exista
    const group = await prisma.group.findUnique({
      where: { id: groupId },
    })

    if (!group) {
      throw new Error('El grupo seleccionado no existe')
    }

    const territory = await prisma.territory.create({
      data: {
        number,
        groupId,
        description,
        ...(blockLetters &&
          blockLetters.length > 0 && {
            blocks: {
              create: blockLetters.map((letter) => ({
                letter,
              })),
            },
          }),
      },
      include: {
        blocks: true,
        group: true,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath('/admin/territories')

    return {
      success: true,
      data: territory,
      message: `Territorio ${number} creado correctamente`,
    }
  } catch (error) {
    console.error('Error al crear territorio:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al crear el territorio',
    }
  }
}

/**
 * Obtiene todos los territorios con paginación
 */
export async function getAllTerritories(page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize

    // Obtener la última fecha de asignación de cada territorio
    const [lastDriverEnds, lastPersonalReturns] = await Promise.all([
      prisma.assignment.groupBy({
        by: ['territoryId'],
        where: { isCompleted: true },
        _max: { endDate: true },
      }),
      prisma.personalAssignment.groupBy({
        by: ['territoryId'],
        where: { isActive: false },
        _max: { returnedDate: true },
      }),
    ])

    // Mapa: territoryId → última fecha
    const lastDateMap = new Map<string, Date>()
    lastDriverEnds.forEach((a) => {
      if (a._max.endDate) {
        const existing = lastDateMap.get(a.territoryId)
        if (!existing || a._max.endDate! > existing) {
          lastDateMap.set(a.territoryId, a._max.endDate!)
        }
      }
    })
    lastPersonalReturns.forEach((pa) => {
      if (pa._max.returnedDate) {
        const existing = lastDateMap.get(pa.territoryId)
        if (!existing || pa._max.returnedDate! > existing) {
          lastDateMap.set(pa.territoryId, pa._max.returnedDate!)
        }
      }
    })

    const [territories, total, assignmentsCount, blocksAgg] = await Promise.all([
      prisma.territory.findMany({
        skip,
        take: pageSize,
        include: {
          blocks: true,
          group: true,
          assignments: {
            where: {
              isCompleted: false,
            },
            include: {
              driver: {
                include: {
                  group: true,
                },
              },
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 1,
          },
          personalAssignments: {
            where: {
              isActive: true,
            },
            include: {
              member: {
                include: {
                  group: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
              personalAssignments: true,
            },
          },
        },
        orderBy: {
          number: 'asc',
        },
      }),
      prisma.territory.count(),
      prisma.territory.count({
        where: {
          assignments: { some: {} },
        },
      }),
      prisma.block.aggregate({
        _count: true,
      }),
    ])

    // Agregar lastAssignmentDate a cada territorio
    const enrichedTerritories = territories.map((t) => ({
      ...t,
      lastAssignmentDate: lastDateMap.get(t.id) || null,
    }))

    return {
      success: true,
      data: enrichedTerritories,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
      territoriesWithAssignments: assignmentsCount,
      totalBlocks: blocksAgg._count,
    }
  } catch (error) {
    console.error('Error al obtener territorios:', error)
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      territoriesWithAssignments: 0,
      totalBlocks: 0,
      message: 'Error al obtener los territorios',
    }
  }
}

/**
 * Obtiene un territorio específico con su historial
 */
export async function getTerritoryById(territoryId: string) {
  try {
    const territory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        blocks: {
          include: {
            dailyRecords: {
              orderBy: {
                date: 'desc',
              },
              take: 1,
            },
          },
        },
        group: true,
        assignments: {
          include: {
            driver: {
              include: {
                group: true,
              },
            },
            blocks: true,
            dailyRecords: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        },
      },
    })

    if (!territory) {
      throw new Error('Territorio no encontrado')
    }

    return {
      success: true,
      data: territory,
    }
  } catch (error) {
    console.error('Error al obtener territorio:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al obtener el territorio',
    }
  }
}

/**
 * Actualiza un territorio existente
 */
export async function updateTerritory(
  territoryId: string,
  data: {
    number?: number
    description?: string
    groupId?: string
    blockLetters?: string[]
  }
) {
  try {
    // Verificar que el territorio existe
    const existingTerritory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: { blocks: true },
    })

    if (!existingTerritory) {
      throw new Error('Territorio no encontrado')
    }

    // Si se está cambiando el número, verificar que no exista otro con ese número
    if (data.number && data.number !== existingTerritory.number) {
      const duplicateNumber = await prisma.territory.findUnique({
        where: { number: data.number },
      })

      if (duplicateNumber) {
        throw new Error(`Ya existe un territorio con el número ${data.number}`)
      }
    }

    // Si se está cambiando el grupo, verificar que existe
    if (data.groupId) {
      const group = await prisma.group.findUnique({
        where: { id: data.groupId },
      })

      if (!group) {
        throw new Error('El grupo seleccionado no existe')
      }
    }

    // Actualizar territorio
    const territory = await prisma.territory.update({
      where: { id: territoryId },
      data: {
        ...(data.number !== undefined && { number: data.number }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.groupId && { groupId: data.groupId }),
      },
      include: {
        blocks: true,
        group: true,
      },
    })

    // Manejar bloques si se proporcionaron
    if (data.blockLetters) {
      const newBlockLetters = data.blockLetters
      const existingBlockLetters = existingTerritory.blocks.map(b => b.letter)

      // Bloques a eliminar
      const blocksToDelete = existingTerritory.blocks.filter(
        b => !newBlockLetters.includes(b.letter)
      )

      // Bloques a crear
      const blocksToCreate = newBlockLetters.filter(
        letter => !existingBlockLetters.includes(letter)
      )

      // Eliminar bloques
      if (blocksToDelete.length > 0) {
        await prisma.block.deleteMany({
          where: {
            id: { in: blocksToDelete.map(b => b.id) },
          },
        })
      }

      // Crear bloques nuevos
      if (blocksToCreate.length > 0) {
        await prisma.block.createMany({
          data: blocksToCreate.map(letter => ({
            letter,
            territoryId,
          })),
        })
      }
    }

    revalidatePath('/dashboard')
    revalidatePath('/admin/territories')

    return {
      success: true,
      data: territory,
      message: `Territorio ${territory.number} actualizado correctamente`,
    }
  } catch (error) {
    console.error('Error al actualizar territorio:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al actualizar el territorio',
    }
  }
}

/**
 * Obtiene un territorio por su número
 */
export async function getTerritoryByNumber(number: number) {
  try {
    const territory = await prisma.territory.findUnique({
      where: { number },
      include: {
        blocks: true,
        assignments: {
          include: {
            driver: {
              include: {
                group: true,
              },
            },
          },
          orderBy: {
            startDate: 'desc',
          },
        },
      },
    })

    if (!territory) {
      throw new Error(`Territorio ${number} no encontrado`)
    }

    return {
      success: true,
      data: territory,
    }
  } catch (error) {
    console.error('Error al obtener territorio:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al obtener el territorio',
    }
  }
}

/**
 * Añade manzanas a un territorio
 */
export async function addBlocksToTerritory(
  territoryId: string,
  blockLetters: string[]
) {
  try {
    const territory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        blocks: true,
      },
    })

    if (!territory) {
      throw new Error('Territorio no encontrado')
    }

    // Filtrar las letras que ya existen
    const existingLetters = territory.blocks.map((b) => b.letter)
    const newLetters = blockLetters.filter((l) => !existingLetters.includes(l))

    if (newLetters.length === 0) {
      return {
        success: false,
        data: null,
        message: 'Todas las manzanas ya existen en este territorio',
      }
    }

    const updatedTerritory = await prisma.territory.update({
      where: { id: territoryId },
      data: {
        blocks: {
          create: newLetters.map((letter) => ({
            letter,
          })),
        },
      },
      include: {
        blocks: true,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${territoryId}`)

    return {
      success: true,
      data: updatedTerritory,
      message: `${newLetters.length} manzana(s) añadida(s) correctamente`,
    }
  } catch (error) {
    console.error('Error al añadir manzanas:', error)
    return {
      success: false,
      data: null,
      message: 'Error al añadir las manzanas',
    }
  }
}

/**
 * Elimina un territorio (solo si no tiene asignaciones)
 */
export async function deleteTerritory(territoryId: string) {
  try {
    const territory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        assignments: true,
      },
    })

    if (!territory) {
      throw new Error('Territorio no encontrado')
    }

    if (territory.assignments.length > 0) {
      throw new Error(
        'No se puede eliminar un territorio que tiene asignaciones'
      )
    }

    await prisma.territory.delete({
      where: { id: territoryId },
    })

    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Territorio eliminado correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar territorio:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Error al eliminar el territorio',
    }
  }
}


export async function getAllTerritoriesForSelect() {
  try {
    const territories = await prisma.territory.findMany({
      select: {
        id: true,
        number: true,
        description: true,
        blocks: {
          select: {
            letter: true,
          },
        },
      },
      orderBy: {
        number: 'asc',
      },
    })

    return {
      success: true,
      data: territories,
    }
  } catch (error) {
    console.error('Error al obtener territorios:', error)
    return {
      success: false,
      data: [],
    }
  }
}

/**
 * Obtiene todos los territorios sin paginación (para administración con filtros)
 */
export async function getAllTerritoriesForAdmin() {
  try {
    // Obtener la última fecha de asignación de cada territorio
    const [lastDriverEnds, lastPersonalReturns] = await Promise.all([
      prisma.assignment.groupBy({
        by: ['territoryId'],
        where: { isCompleted: true },
        _max: { endDate: true },
      }),
      prisma.personalAssignment.groupBy({
        by: ['territoryId'],
        where: { isActive: false },
        _max: { returnedDate: true },
      }),
    ])

    // Mapa: territoryId → última fecha
    const lastDateMap = new Map<string, Date>()
    lastDriverEnds.forEach((a) => {
      if (a._max.endDate) {
        const existing = lastDateMap.get(a.territoryId)
        if (!existing || a._max.endDate! > existing) {
          lastDateMap.set(a.territoryId, a._max.endDate!)
        }
      }
    })
    lastPersonalReturns.forEach((pa) => {
      if (pa._max.returnedDate) {
        const existing = lastDateMap.get(pa.territoryId)
        if (!existing || pa._max.returnedDate! > existing) {
          lastDateMap.set(pa.territoryId, pa._max.returnedDate!)
        }
      }
    })

    const [territories, total, assignmentsCount, blocksAgg] = await Promise.all([
      prisma.territory.findMany({
        include: {
          blocks: true,
          group: true,
          assignments: {
            where: {
              isCompleted: false,
            },
            include: {
              driver: {
                include: {
                  group: true,
                },
              },
            },
            orderBy: {
              startDate: 'desc',
            },
            take: 1,
          },
          personalAssignments: {
            where: {
              isActive: true,
            },
            include: {
              member: {
                include: {
                  group: true,
                },
              },
            },
          },
          _count: {
            select: {
              assignments: true,
              personalAssignments: true,
            },
          },
        },
        orderBy: {
          number: 'asc',
        },
      }),
      prisma.territory.count(),
      prisma.territory.count({
        where: {
          assignments: { some: {} },
        },
      }),
      prisma.block.aggregate({
        _count: true,
      }),
    ])

    // Agregar lastAssignmentDate a cada territorio
    const enrichedTerritories = territories.map((t) => ({
      ...t,
      lastAssignmentDate: lastDateMap.get(t.id) || null,
    }))

    return {
      success: true,
      data: enrichedTerritories,
      total,
      territoriesWithAssignments: assignmentsCount,
      totalBlocks: blocksAgg._count,
    }
  } catch (error) {
    console.error('Error al obtener territorios:', error)
    return {
      success: false,
      data: [],
      total: 0,
      territoriesWithAssignments: 0,
      totalBlocks: 0,
      message: 'Error al obtener los territorios',
    }
  }
}
