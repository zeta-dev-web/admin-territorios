'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentTenantId } from '@/lib/tenant'
import {
  DashboardMetrics,
  TerritoryProgress,
  AtrasadoTerritory,
  TerritoryFrequency,
  BlockStatus,
} from '@/types'

/**
 * Obtiene todas las métricas del dashboard
 * @returns Métricas de territorios activos, fríos y frecuencia
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const tenantId = await getCurrentTenantId()

    // 1. TERRITORIOS ACTIVOS CON PROGRESO
    const activeAssignments = await prisma.assignment.findMany({
      where: {
        isCompleted: false,
        tenantId,
      },
      include: {
        territory: {
          include: {
            blocks: true,
          },
        },
        driver: {
          select: {
            name: true,
          },
        },
        blocks: true,
        dailyRecords: {
          select: {
            blockId: true,
            date: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
      orderBy: {
        startDate: 'desc',
      },
    })

    const activeTerritoriesProgress: TerritoryProgress[] = activeAssignments.map(
      (assignment) => {
        const totalBlocks = assignment.blocks.length

        // Agrupar registros por blockId para obtener el último trabajo de cada manzana
        const blockWorkMap = new Map<string, Date>()
        assignment.dailyRecords.forEach((record) => {
          if (!blockWorkMap.has(record.blockId)) {
            blockWorkMap.set(record.blockId, record.date)
          }
        })

        const completedBlocks = blockWorkMap.size

        // Crear array de estado de bloques
        const blocks: BlockStatus[] = assignment.blocks.map((block) => ({
          id: block.id,
          letter: block.letter,
          isCompleted: blockWorkMap.has(block.id),
          lastWorkedDate: blockWorkMap.get(block.id) || null,
        }))

        const progressPercentage =
          totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0

        return {
          territoryId: assignment.territory.id,
          territoryNumber: assignment.territory.number,
          assignmentId: assignment.id,
          driverName: assignment.driver.name,
          startDate: assignment.startDate,
          totalBlocks,
          completedBlocks,
          progressPercentage,
          blocks,
        }
      }
    )

    // 2. TERRITORIOS "ATRASADOS" (+6 meses sin asignación)
    // Buscar el último evento de cada territorio (asignación completada o personal devuelto)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    // Obtener la última fecha de asignación de cada territorio
    const [lastDriverAssignments, lastPersonalAssignments] = await Promise.all([
      // Última asignación de conductor (completada o devuelta)
      prisma.assignment.groupBy({
        by: ['territoryId'],
        where: { isCompleted: true, tenantId },
        _max: { endDate: true },
      }),
      // Última asignación personal devuelta
      prisma.personalAssignment.groupBy({
        by: ['territoryId'],
        where: { isActive: false, tenantId },
        _max: { returnedDate: true },
      }),
    ])

    // Construir un mapa: territoryId → última fecha y tipo
    const lastDateMap = new Map<string, { date: Date; type: 'conductor' | 'personal' }>()

    lastDriverAssignments.forEach((a) => {
      if (a._max.endDate) {
        const existing = lastDateMap.get(a.territoryId)
        if (!existing || a._max.endDate! > existing.date) {
          lastDateMap.set(a.territoryId, { date: a._max.endDate!, type: 'conductor' })
        }
      }
    })

    lastPersonalAssignments.forEach((pa) => {
      if (pa._max.returnedDate) {
        const existing = lastDateMap.get(pa.territoryId)
        if (!existing || pa._max.returnedDate! > existing.date) {
          lastDateMap.set(pa.territoryId, { date: pa._max.returnedDate!, type: 'personal' })
        }
      }
    })

    // IDs de territorios con asignación activa
    const activeTerritoryIds = new Set(activeTerritoriesProgress.map((t) => t.territoryId))

    // Obtener todos los territorios para tener números y filtrar
    const allTerritories = await prisma.territory.findMany({
      where: { tenantId },
      select: { id: true, number: true },
      orderBy: { number: 'asc' },
    })

    const atrasados: AtrasadoTerritory[] = allTerritories
      .filter((t) => !activeTerritoryIds.has(t.id)) // Sin asignación activa
      .map((t) => {
        const lastInfo = lastDateMap.get(t.id)
        const lastAssignmentDate = lastInfo?.date || null
        const lastAssignmentType = lastInfo?.type || null

        let daysSinceLastAssignment: number | null = null
        if (lastAssignmentDate) {
          const now = new Date()
          daysSinceLastAssignment = Math.ceil(
            (now.getTime() - lastAssignmentDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        }

        return {
          territoryId: t.id,
          territoryNumber: t.number,
          lastAssignmentDate,
          daysSinceLastAssignment,
          lastAssignmentType,
        }
      })
      .filter((t) => {
        // Solo los que superan los 6 meses (o nunca se asignaron)
        if (t.daysSinceLastAssignment === null) return true // nunca asignado
        return t.daysSinceLastAssignment > 180 // más de ~6 meses
      })
      .sort((a, b) => {
        // Los más atrasados primero
        if (a.daysSinceLastAssignment === null) return -1
        if (b.daysSinceLastAssignment === null) return 1
        return b.daysSinceLastAssignment - a.daysSinceLastAssignment
    })

    // 3. HISTORIAL Y FRECUENCIA DE TERRITORIOS
    const territoryStats = await prisma.assignment.groupBy({
      by: ['territoryId'],
      where: {
        isCompleted: true,
        tenantId,
      },
      _count: {
        id: true,
      },
    })

    // Obtener información de los territorios
    const territoryIds = territoryStats.map((stat) => stat.territoryId)
    const territories = await prisma.territory.findMany({
      where: {
        id: {
          in: territoryIds,
        },
        tenantId,
      },
      select: {
        id: true,
        number: true,
      },
    })

    const territoryMap = new Map(territories.map((t) => [t.id, t.number]))

    const territoryFrequency: TerritoryFrequency[] = territoryStats
      .map((stat) => ({
        territoryId: stat.territoryId,
        territoryNumber: territoryMap.get(stat.territoryId) || 0,
        completedAssignments: stat._count.id,
      }))
      .sort((a, b) => b.completedAssignments - a.completedAssignments) // Los más trabajados primero

    return {
      activeTerritoriesProgress,
      atrasados,
      territoryFrequency,
    }
  } catch (error) {
    console.error('Error al obtener métricas del dashboard:', error)
    // Retornar estructura vacía en caso de error
    return {
      activeTerritoriesProgress: [],
      atrasados: [],
      territoryFrequency: [],
    }
  }
}

/**
 * Obtiene el progreso detallado de un territorio específico
 */
export async function getTerritoryProgress(territoryId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const activeAssignment = await prisma.assignment.findFirst({
      where: {
        territoryId,
        isCompleted: false,
        tenantId,
      },
      include: {
        territory: true,
        driver: {
          include: {
            group: true,
          },
        },
        blocks: {
          include: {
            dailyRecords: {
              include: {
                driver: true,
              },
              orderBy: {
                date: 'desc',
              },
            },
          },
        },
        dailyRecords: {
          include: {
            block: true,
            driver: true,
          },
          orderBy: {
            date: 'desc',
          },
        },
      },
    })

    if (!activeAssignment) {
      return {
        success: false,
        data: null,
        message: 'No hay asignación activa para este territorio',
      }
    }

    const totalBlocks = activeAssignment.blocks.length
    const blockWorkMap = new Map<string, Date>()

    activeAssignment.dailyRecords.forEach((record) => {
      if (!blockWorkMap.has(record.blockId)) {
        blockWorkMap.set(record.blockId, record.date)
      }
    })

    const completedBlocks = blockWorkMap.size
    const progressPercentage =
      totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0

    const blocks: BlockStatus[] = activeAssignment.blocks.map((block) => ({
      id: block.id,
      letter: block.letter,
      isCompleted: blockWorkMap.has(block.id),
      lastWorkedDate: blockWorkMap.get(block.id) || null,
    }))

    return {
      success: true,
      data: {
        assignment: activeAssignment,
        progress: {
          totalBlocks,
          completedBlocks,
          progressPercentage,
          blocks,
        },
      },
    }
  } catch (error) {
    console.error('Error al obtener progreso del territorio:', error)
    return {
      success: false,
      data: null,
      message: 'Error al obtener el progreso del territorio',
    }
  }
}

/**
 * Obtiene los bloques de una asignación específica por assignmentId
 */
export async function getAssignmentBlocks(assignmentId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
      include: {
        territory: true,
        driver: {
          include: {
            group: true,
          },
        },
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
      },
    })

    if (!assignment) {
      return {
        success: false,
        data: null,
        message: 'Asignación no encontrada',
      }
    }

    const blockWorkMap = new Map<string, Date>()

    // Obtener todos los registros para encontrar el primer trabajo de cada bloque
    const allRecords = await prisma.dailyRecord.findMany({
      where: { assignmentId },
      orderBy: { date: 'desc' },
    })

    allRecords.forEach((record) => {
      if (!blockWorkMap.has(record.blockId)) {
        blockWorkMap.set(record.blockId, record.date)
      }
    })

    const blocks: BlockStatus[] = assignment.blocks.map((block) => ({
      id: block.id,
      letter: block.letter,
      isCompleted: blockWorkMap.has(block.id),
      lastWorkedDate: blockWorkMap.get(block.id) || null,
    }))

    return {
      success: true,
      data: {
        assignment,
        blocks,
      },
    }
  } catch (error) {
    console.error('Error al obtener bloques de la asignación:', error)
    return {
      success: false,
      data: null,
      message: 'Error al obtener los bloques de la asignación',
    }
  }
}

/**
 * Obtiene estadísticas generales del sistema
 */
export async function getGeneralStats() {
  try {
    const tenantId = await getCurrentTenantId()
    const [
      totalTerritories,
      totalDrivers,
      totalGroups,
      activeAssignments,
      completedAssignments,
    ] = await Promise.all([
      prisma.territory.count({ where: { tenantId } }),
      prisma.driver.count({ where: { tenantId } }),
      prisma.group.count({ where: { tenantId } }),
      prisma.assignment.count({ where: { isCompleted: false, tenantId } }),
      prisma.assignment.count({ where: { isCompleted: true, tenantId } }),
    ])

    return {
      success: true,
      data: {
        totalTerritories,
        totalDrivers,
        totalGroups,
        activeAssignments,
        completedAssignments,
        totalAssignments: activeAssignments + completedAssignments,
      },
    }
  } catch (error) {
    console.error('Error al obtener estadísticas generales:', error)
    return {
      success: false,
      data: null,
      message: 'Error al obtener estadísticas',
    }
  }
}
