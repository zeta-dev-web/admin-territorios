'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { tenantFilter, tenantData } from '@/lib/scoped-prisma'

export async function createTerritory(
  number: number, groupId: string, description?: string, blockLetters?: string[]
) {
  try {
    const tenantId = await getCurrentTenantId()

    const existingTerritory = await prisma.territory.findFirst({
      where: tenantFilter(tenantId, { number }),
    })
    if (existingTerritory) throw new Error(`Ya existe un territorio con el número ${number}`)

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) throw new Error('El grupo seleccionado no existe')

    const territory = await prisma.territory.create({
      data: tenantData(tenantId, {
        number,
        groupId,
        description,
        ...(blockLetters && blockLetters.length > 0 && {
          blocks: { create: blockLetters.map((letter) => ({ letter })) },
        }),
      }) as any,
      include: { blocks: true, group: true },
    })

    revalidatePath('/territorios')
    revalidatePath('/territorios/lista')

    return { success: true, data: territory, message: `Territorio ${number} creado correctamente` }
  } catch (error) {
    console.error('Error al crear territorio:', error)
    return {
      success: false, data: null,
      message: error instanceof Error ? error.message : 'Error al crear el territorio',
    }
  }
}

export async function getAllTerritories(page = 1, pageSize = 10) {
  try {
    const tenantId = await getCurrentTenantId()
    const skip = (page - 1) * pageSize

    const [lastDriverEnds, lastPersonalReturns] = await Promise.all([
      prisma.assignment.groupBy({
        by: ['territoryId'],
        where: tenantFilter(tenantId, { isCompleted: true }) as any,
        _max: { endDate: true },
      }),
      prisma.personalAssignment.groupBy({
        by: ['territoryId'],
        where: tenantFilter(tenantId, { isActive: false }) as any,
        _max: { returnedDate: true },
      }),
    ])

    const lastDateMap = new Map<string, Date>()
    lastDriverEnds.forEach((a) => {
      if (a._max.endDate) {
        const existing = lastDateMap.get(a.territoryId)
        if (!existing || a._max.endDate! > existing) lastDateMap.set(a.territoryId, a._max.endDate!)
      }
    })
    lastPersonalReturns.forEach((pa) => {
      if (pa._max.returnedDate) {
        const existing = lastDateMap.get(pa.territoryId)
        if (!existing || pa._max.returnedDate! > existing) lastDateMap.set(pa.territoryId, pa._max.returnedDate!)
      }
    })

    const [territories, total] = await Promise.all([
      prisma.territory.findMany({
        where: tenantFilter(tenantId),
        skip,
        take: pageSize,
        include: {
          blocks: true,
          group: true,
          assignments: {
            where: { isCompleted: false },
            include: { publisher: { include: { group: true } } },
            orderBy: { startDate: 'desc' },
            take: 1,
          },
          personalAssignments: {
            where: { isActive: true },
            include: { publisher: { include: { group: true } } },
          },
          _count: { select: { assignments: true, personalAssignments: true } },
        },
        orderBy: { number: 'asc' },
      }),
      prisma.territory.count({ where: tenantFilter(tenantId) }),
    ])

    const personName = (p: { firstName: string; lastName: string } | null) =>
      p ? `${p.firstName} ${p.lastName}`.trim() : ''

    const enrichedTerritories = territories.map((t) => ({
      ...t,
      lastAssignmentDate: lastDateMap.get(t.id) || null,
      assignments: t.assignments.map((a) => {
        const { publisher, ...rest } = a
        return { ...rest, driver: publisher ? { ...publisher, name: personName(publisher) } : null }
      }),
      personalAssignments: t.personalAssignments.map((pa) => {
        const { publisher, ...rest } = pa
        return { ...rest, member: publisher ? { ...publisher, name: personName(publisher) } : null }
      }),
    }))

    return {
      success: true, data: enrichedTerritories, total, page, pageSize,
      totalPages: Math.ceil(total / pageSize),
    }
  } catch (error) {
    console.error('Error al obtener territorios:', error)
    return { success: false, data: [], total: 0, page: 1, pageSize: 10, totalPages: 0 }
  }
}

export async function getTerritoryById(territoryId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const territory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: {
        blocks: { include: { dailyRecords: { orderBy: { date: 'desc' }, take: 1 } } },
        group: true,
        assignments: {
          include: { publisher: { include: { group: true } }, blocks: true, dailyRecords: true },
          orderBy: { startDate: 'desc' },
        },
      },
    })
    if (!territory) throw new Error('Territorio no encontrado')
    return { success: true, data: territory }
  } catch (error) {
    console.error('Error al obtener territorio:', error)
    return {
      success: false, data: null,
      message: error instanceof Error ? error.message : 'Error al obtener el territorio',
    }
  }
}

export async function updateTerritory(
  territoryId: string,
  data: { number?: number; description?: string; groupId?: string; blockLetters?: string[] }
) {
  try {
    const tenantId = await getCurrentTenantId()
    const existingTerritory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: { blocks: true },
    })
    if (!existingTerritory) throw new Error('Territorio no encontrado')

    if (data.number && data.number !== existingTerritory.number) {
      const duplicateNumber = await prisma.territory.findFirst({
        where: tenantFilter(tenantId, { number: data.number }),
      })
      if (duplicateNumber) throw new Error(`Ya existe un territorio con el número ${data.number}`)
    }

    if (data.groupId) {
      const group = await prisma.group.findUnique({ where: { id: data.groupId } })
      if (!group) throw new Error('El grupo seleccionado no existe')
    }

    const territory = await prisma.territory.update({
      where: { id: territoryId },
      data: {
        ...(data.number !== undefined && { number: data.number }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.groupId && { groupId: data.groupId }),
      },
      include: { blocks: true, group: true },
    })

    if (data.blockLetters) {
      const existingLetters = existingTerritory.blocks.map((b) => b.letter)
      const blocksToDelete = existingTerritory.blocks.filter((b) => !data.blockLetters!.includes(b.letter))
      const blocksToCreate = data.blockLetters.filter((l) => !existingLetters.includes(l))

      if (blocksToDelete.length > 0) {
        await prisma.block.deleteMany({ where: { id: { in: blocksToDelete.map((b) => b.id) } } })
      }
      if (blocksToCreate.length > 0) {
        await prisma.block.createMany({
          data: blocksToCreate.map((letter) => ({ letter, territoryId })),
        })
      }
    }

    revalidatePath('/territorios')
    revalidatePath('/territorios/lista')

    return { success: true, data: territory, message: `Territorio ${territory.number} actualizado correctamente` }
  } catch (error) {
    console.error('Error al actualizar territorio:', error)
    return {
      success: false, data: null,
      message: error instanceof Error ? error.message : 'Error al actualizar el territorio',
    }
  }
}

export async function getTerritoryByNumber(number: number) {
  try {
    const tenantId = await getCurrentTenantId()
    const territory = await prisma.territory.findFirst({
      where: tenantFilter(tenantId, { number }),
      include: {
        blocks: true,
        assignments: {
          include: { publisher: { include: { group: true } } },
          orderBy: { startDate: 'desc' },
        },
      },
    })
    if (!territory) throw new Error(`Territorio ${number} no encontrado`)
    return { success: true, data: territory }
  } catch (error) {
    console.error('Error al obtener territorio:', error)
    return {
      success: false, data: null,
      message: error instanceof Error ? error.message : 'Error al obtener el territorio',
    }
  }
}

export async function addBlocksToTerritory(territoryId: string, blockLetters: string[]) {
  try {
    const tenantId = await getCurrentTenantId()
    const territory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: { blocks: true },
    })
    if (!territory) throw new Error('Territorio no encontrado')

    const existingLetters = territory.blocks.map((b) => b.letter)
    const newLetters = blockLetters.filter((l) => !existingLetters.includes(l))
    if (newLetters.length === 0) {
      return { success: false, data: null, message: 'Todas las manzanas ya existen en este territorio' }
    }

    const updatedTerritory = await prisma.territory.update({
      where: { id: territoryId },
      data: { blocks: { create: newLetters.map((letter) => ({ letter })) } },
      include: { blocks: true },
    })

    revalidatePath('/territorios')
    revalidatePath(`/territorios/${territoryId}`)
    revalidatePath('/territorios/lista')

    return { success: true, data: updatedTerritory, message: `${newLetters.length} manzana(s) añadida(s) correctamente` }
  } catch (error) {
    console.error('Error al añadir manzanas:', error)
    return {
      success: false, data: null,
      message: error instanceof Error ? error.message : 'Error al añadir las manzanas',
    }
  }
}

export async function deleteTerritory(territoryId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const territory = await prisma.territory.findUnique({
      where: { id: territoryId },
      include: { assignments: true },
    })
    if (!territory) throw new Error('Territorio no encontrado')
    if (territory.assignments.length > 0) {
      throw new Error('No se puede eliminar un territorio que tiene asignaciones')
    }
    await prisma.territory.delete({ where: { id: territoryId } })

    revalidatePath('/territorios')
    revalidatePath('/territorios/lista')

    return { success: true, message: 'Territorio eliminado correctamente' }
  } catch (error) {
    console.error('Error al eliminar territorio:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar el territorio',
    }
  }
}

export async function getAllTerritoriesForSelect() {
  try {
    const tenantId = await getCurrentTenantId()
    const territories = await prisma.territory.findMany({
      where: tenantFilter(tenantId),
      select: { id: true, number: true, description: true, blocks: { select: { letter: true } } },
      orderBy: { number: 'asc' },
    })
    return { success: true, data: territories }
  } catch (error) {
    console.error('Error al obtener territorios:', error)
    return { success: false, data: [] }
  }
}

export async function getAllTerritoriesForAdmin() {
  try {
    const tenantId = await getCurrentTenantId()

    const [lastDriverEnds, lastPersonalReturns] = await Promise.all([
      prisma.assignment.groupBy({
        by: ['territoryId'],
        where: tenantFilter(tenantId, { isCompleted: true }) as any,
        _max: { endDate: true },
      }),
      prisma.personalAssignment.groupBy({
        by: ['territoryId'],
        where: tenantFilter(tenantId, { isActive: false }) as any,
        _max: { returnedDate: true },
      }),
    ])

    const lastDateMap = new Map<string, Date>()
    lastDriverEnds.forEach((a) => {
      if (a._max.endDate) {
        const existing = lastDateMap.get(a.territoryId)
        if (!existing || a._max.endDate! > existing) lastDateMap.set(a.territoryId, a._max.endDate!)
      }
    })
    lastPersonalReturns.forEach((pa) => {
      if (pa._max.returnedDate) {
        const existing = lastDateMap.get(pa.territoryId)
        if (!existing || pa._max.returnedDate! > existing) lastDateMap.set(pa.territoryId, pa._max.returnedDate!)
      }
    })

    const [territories, total, assignmentsCount, blocksAgg] = await Promise.all([
      prisma.territory.findMany({
        where: tenantFilter(tenantId),
        include: {
          blocks: true, group: true,
          assignments: {
            where: { isCompleted: false },
            include: { publisher: { include: { group: true } } },
            orderBy: { startDate: 'desc' }, take: 1,
          },
          personalAssignments: {
            where: { isActive: true },
            include: { publisher: { include: { group: true } } },
          },
          _count: { select: { assignments: true, personalAssignments: true } },
        },
        orderBy: { number: 'asc' },
      }),
      prisma.territory.count({ where: tenantFilter(tenantId) }),
      prisma.territory.count({
        where: { ...tenantFilter(tenantId), assignments: { some: {} } },
      }),
      prisma.block.aggregate({
        _count: true,
      }),
    ])

    const personName = (p: { firstName: string; lastName: string } | null) =>
      p ? `${p.firstName} ${p.lastName}`.trim() : ''

    const enrichedTerritories = territories.map((t) => ({
      ...t,
      lastAssignmentDate: lastDateMap.get(t.id) || null,
      assignments: t.assignments.map((a) => {
        const { publisher, ...rest } = a
        return { ...rest, driver: publisher ? { ...publisher, name: personName(publisher) } : null }
      }),
      personalAssignments: t.personalAssignments.map((pa) => {
        const { publisher, ...rest } = pa
        return { ...rest, member: publisher ? { ...publisher, name: personName(publisher) } : null }
      }),
    }))

    return {
      success: true, data: enrichedTerritories, total,
      territoriesWithAssignments: assignmentsCount,
      totalBlocks: blocksAgg._count,
    }
  } catch (error) {
    console.error('Error al obtener territorios:', error)
    return { success: false, data: [], total: 0, territoriesWithAssignments: 0, totalBlocks: 0 }
  }
}
