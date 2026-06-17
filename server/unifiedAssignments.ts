'use server'

import { prisma } from '@/lib/prisma'

export type UnifiedAssignmentType = 'CONDUCTOR' | 'PERSONAL'

export interface UnifiedAssignment {
  id: string
  type: UnifiedAssignmentType
  territoryId: string
  territoryNumber: number
  territoryDescription: string | null
  assigneeId: string
  assigneeName: string
  groupName: string
  assignedDate: Date
  endDate: Date | null
  isActive: boolean
  isCompleted: boolean
  notes?: string | null
  blocksTotal?: number
  blocksCompleted?: number
}

/**
 * Obtiene todas las asignaciones activas (conductores + personales) en un formato unificado con paginación
 */
export async function getUnifiedAssignments(page = 1, pageSize = 10) {
  try {
    const [driverAssignments, personalAssignments] = await Promise.all([
      prisma.assignment.findMany({
        where: { isCompleted: false },
        include: {
          territory: true,
          driver: {
            include: { group: true },
          },
          _count: { select: { blocks: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      prisma.personalAssignment.findMany({
        where: { isActive: true },
        include: {
          territory: true,
          member: {
            include: { group: true },
          },
        },
        orderBy: { assignedDate: 'desc' },
      }),
    ])

    // Calcular bloques completados para conductores
    const driverWithProgress = await Promise.all(
      driverAssignments.map(async (assignment) => {
        const uniqueWorkedBlocks = await prisma.block.count({
          where: {
            assignmentId: assignment.id,
            dailyRecords: { some: { assignmentId: assignment.id } },
          },
        })

        return {
          id: assignment.id,
          type: 'CONDUCTOR' as UnifiedAssignmentType,
          territoryId: assignment.territoryId,
          territoryNumber: assignment.territory.number,
          territoryDescription: assignment.territory.description,
          assigneeId: assignment.driverId,
          assigneeName: assignment.driver.name,
          groupName: assignment.driver.group.name,
          assignedDate: assignment.startDate,
          endDate: assignment.endDate,
          isActive: !assignment.isCompleted,
          isCompleted: assignment.isCompleted,
          blocksTotal: assignment._count.blocks,
          blocksCompleted: uniqueWorkedBlocks,
        }
      })
    )

    const personalUnified = personalAssignments.map((pa) => ({
      id: pa.id,
      type: 'PERSONAL' as UnifiedAssignmentType,
      territoryId: pa.territoryId,
      territoryNumber: pa.territory.number,
      territoryDescription: pa.territory.description,
      assigneeId: pa.memberId,
      assigneeName: pa.member.name,
      groupName: pa.member.group.name,
      assignedDate: pa.assignedDate,
      endDate: pa.returnedDate,
      isActive: pa.isActive,
      isCompleted: !pa.isActive,
      blocksTotal: undefined,
      blocksCompleted: undefined,
      notes: pa.notes,
    }))

    const unified: UnifiedAssignment[] = [
      ...driverWithProgress,
      ...personalUnified,
    ].sort((a, b) => b.assignedDate.getTime() - a.assignedDate.getTime())

    const total = driverAssignments.length + personalAssignments.length
    const totalPages = Math.ceil(total / pageSize)
    const skip = (page - 1) * pageSize
    const paginatedData = unified.slice(skip, skip + pageSize)

    // Stats globales sobre el total de datos (no solo la página)
    const totalConductor = driverAssignments.length
    const totalPersonal = personalAssignments.length
    const totalUniqueTerritories = new Set(unified.map(a => a.territoryId)).size

    return {
      success: true,
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
      conductorCount: totalConductor,
      personalCount: totalPersonal,
      uniqueTerritories: totalUniqueTerritories,
    }
  } catch (error) {
    console.error('Error al obtener asignaciones unificadas:', error)
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      conductorCount: 0,
      personalCount: 0,
      uniqueTerritories: 0,
      message: 'Error al obtener asignaciones',
    }
  }
}

/**
 * Obtiene el historial completo (completadas + devueltas) en formato unificado con paginación
 */
export async function getUnifiedHistory(page = 1, pageSize = 10) {
  try {
    const skip = (page - 1) * pageSize

    const [completedAssignments, returnedPersonals, totalAssignments, totalPersonals] = await Promise.all([
      prisma.assignment.findMany({
        where: { isCompleted: true },
        include: {
          territory: true,
          driver: {
            include: { group: true },
          },
        },
        orderBy: { endDate: 'desc' },
      }),
      prisma.personalAssignment.findMany({
        where: { isActive: false },
        include: {
          territory: true,
          member: {
            include: { group: true },
          },
        },
        orderBy: { returnedDate: 'desc' },
      }),
      prisma.assignment.count({ where: { isCompleted: true } }),
      prisma.personalAssignment.count({ where: { isActive: false } }),
    ])

    const driverHistory = completedAssignments.map((a) => ({
      id: a.id,
      type: 'CONDUCTOR' as UnifiedAssignmentType,
      territoryId: a.territoryId,
      territoryNumber: a.territory.number,
      territoryDescription: a.territory.description,
      assigneeId: a.driverId,
      assigneeName: a.driver.name,
      groupName: a.driver.group.name,
      assignedDate: a.startDate,
      endDate: a.endDate,
      isActive: false,
      isCompleted: true,
    }))

    const personalHistory = returnedPersonals.map((pa) => ({
      id: pa.id,
      type: 'PERSONAL' as UnifiedAssignmentType,
      territoryId: pa.territoryId,
      territoryNumber: pa.territory.number,
      territoryDescription: pa.territory.description,
      assigneeId: pa.memberId,
      assigneeName: pa.member.name,
      groupName: pa.member.group.name,
      assignedDate: pa.assignedDate,
      endDate: pa.returnedDate,
      isActive: false,
      isCompleted: true,
      notes: pa.notes,
    }))

    const unified = [...driverHistory, ...personalHistory].sort((a, b) => {
      if (!a.endDate) return 1
      if (!b.endDate) return -1
      return b.endDate.getTime() - a.endDate.getTime()
    })

    const total = totalAssignments + totalPersonals
    const totalPages = Math.ceil(total / pageSize)
    const paginatedData = unified.slice(skip, skip + pageSize)

    return {
      success: true,
      data: paginatedData,
      total,
      page,
      pageSize,
      totalPages,
      thisMonthCount: unified.filter(a => {
        if (!a.endDate) return false
        const now = new Date()
        return a.endDate.getMonth() === now.getMonth() &&
               a.endDate.getFullYear() === now.getFullYear()
      }).length,
      thisYearCount: unified.filter(a => {
        if (!a.endDate) return false
        return a.endDate.getFullYear() === new Date().getFullYear()
      }).length,
      uniqueTerritories: new Set(unified.map(a => a.territoryId)).size,
    }
  } catch (error) {
    console.error('Error al obtener historial unificado:', error)
    return {
      success: false,
      data: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 0,
      thisMonthCount: 0,
      thisYearCount: 0,
      uniqueTerritories: 0,
      message: 'Error al obtener historial',
    }
  }
}

/**
 * Elimina un registro del historial (funciona para ambos tipos)
 * Borra toda la asignación con sus registros, pero no el territorio
 */
export async function deleteHistoryRecord(
  assignmentId: string,
  type: UnifiedAssignmentType
) {
  if (type === 'PERSONAL') {
    const { deletePersonalAssignment } = await import('./personalAssignments')
    return deletePersonalAssignment(assignmentId)
  } else {
    const { deleteAssignment } = await import('./assignments')
    return deleteAssignment(assignmentId)
  }
}

/**
 * Devuelve una asignación (funciona para ambos tipos)
 * Para CONDUCTOR: marca como completada con endDate
 * Para PERSONAL: marca como devuelta con returnedDate
 * @param returnDate - Fecha opcional de devolución (por defecto: hoy)
 */
export async function returnUnifiedAssignment(
  assignmentId: string,
  type: UnifiedAssignmentType,
  returnDate?: Date
) {
  if (type === 'PERSONAL') {
    const { returnPersonalAssignment } = await import('./personalAssignments')
    return returnPersonalAssignment(assignmentId, returnDate)
  } else {
    const { returnAssignment } = await import('./assignments')
    return returnAssignment(assignmentId, returnDate)
  }
}
