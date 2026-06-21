'use server'

import { prisma } from '@/lib/prisma'
import { CreateAssignmentInput } from '@/types'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { tenantFilter, tenantData } from '@/lib/scoped-prisma'

export async function createAssignment(input: CreateAssignmentInput) {
  try {
    const tenantId = await getCurrentTenantId()

    const territory = await prisma.territory.findUnique({
      where: { id: input.territoryId },
      include: { blocks: true },
    })
    if (!territory) throw new Error(`Territorio con ID ${input.territoryId} no encontrado`)

    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
      include: { group: true },
    })
    if (!driver) throw new Error(`Conductor con ID ${input.driverId} no encontrado`)

    const existingActiveAssignment = await prisma.assignment.findFirst({
      where: { territoryId: input.territoryId, isCompleted: false },
    })
    if (existingActiveAssignment) {
      throw new Error(`El territorio ${territory.number} ya tiene una asignación activa`)
    }

    const blocksToConnect: { id: string }[] = []
    const blocksToCreate: { letter: string; territoryId: string }[] = []

    for (const letter of input.blockLetters) {
      const existingBlock = territory.blocks.find((b) => b.letter === letter)
      if (existingBlock) {
        blocksToConnect.push({ id: existingBlock.id })
      } else {
        blocksToCreate.push({ letter, territoryId: input.territoryId })
      }
    }

    const assignment = await prisma.assignment.create({
      data: tenantData(tenantId, {
        territoryId: input.territoryId,
        driverId: input.driverId,
        isCompleted: false,
        startDate: input.startDate || new Date(),
        blocks: {
          connect: blocksToConnect,
          create: blocksToCreate,
        },
      }) as any,
      include: {
        territory: true,
        driver: { include: { group: true } },
        blocks: true,
      },
    })

    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${input.territoryId}`)
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/admin/territories')

    return {
      success: true,
      data: assignment,
      message: `Asignación creada: Territorio ${territory.number} asignado a ${driver.name}`,
    }
  } catch (error) {
    console.error('Error al crear asignación:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error desconocido al crear la asignación',
    }
  }
}

export async function getActiveAssignments() {
  try {
    const tenantId = await getCurrentTenantId()
    const assignments = await prisma.assignment.findMany({
      where: tenantFilter(tenantId, { isCompleted: false }),
      include: {
        territory: true,
        driver: { include: { group: true } },
        _count: { select: { blocks: true } },
      },
      orderBy: { startDate: 'desc' },
    })

    const assignmentsWithProgress = await Promise.all(
      assignments.map(async (assignment) => {
        const uniqueWorkedBlocks = await prisma.block.count({
          where: {
            assignmentId: assignment.id,
            dailyRecords: { some: { assignmentId: assignment.id } },
          },
        })
        return { ...assignment, _count: { ...assignment._count, dailyRecords: uniqueWorkedBlocks } }
      })
    )

    return { success: true, data: assignmentsWithProgress }
  } catch (error) {
    console.error('Error al obtener asignaciones activas:', error)
    return { success: false, data: [], message: 'Error al obtener las asignaciones activas' }
  }
}

export async function getAssignmentById(assignmentId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        territory: true,
        driver: { include: { group: true } },
        blocks: {
          include: { dailyRecords: { orderBy: { date: 'desc' }, take: 1 } },
        },
        dailyRecords: {
          include: { driver: true, block: true },
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!assignment) throw new Error(`Asignación con ID ${assignmentId} no encontrada`)
    return { success: true, data: assignment }
  } catch (error) {
    console.error('Error al obtener asignación:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al obtener la asignación',
    }
  }
}

export async function completeAssignment(assignmentId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { territory: true, driver: true, _count: { select: { blocks: true } } },
    })
    if (!assignment) throw new Error('Asignación no encontrada')
    if (assignment.isCompleted) throw new Error('Esta asignación ya está completada')

    const totalBlocks = assignment._count.blocks
    const workedBlocks = await prisma.block.count({
      where: {
        assignmentId: assignment.id,
        dailyRecords: { some: { assignmentId: assignment.id } },
      },
    })
    if (workedBlocks < totalBlocks) {
      throw new Error(
        `No se puede completar la asignación. Faltan ${totalBlocks - workedBlocks} manzanas por trabajar (${workedBlocks}/${totalBlocks} completadas)`
      )
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isCompleted: true, endDate: new Date() },
      include: { territory: true, driver: true },
    })

    revalidatePath('/dashboard')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/admin/territories')

    return {
      success: true,
      data: updatedAssignment,
      message: `Asignación completada: Territorio ${assignment.territory.number} por ${assignment.driver.name}`,
    }
  } catch (error) {
    console.error('Error al completar asignación:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al completar la asignación',
    }
  }
}

export async function returnAssignment(assignmentId: string, returnDate?: Date) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { territory: true, driver: true },
    })
    if (!assignment) throw new Error('Asignación no encontrada')
    if (assignment.isCompleted) throw new Error('Esta asignación ya fue completada o devuelta')

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isCompleted: true, endDate: returnDate || new Date() },
      include: { territory: true, driver: true },
    })

    revalidatePath('/dashboard')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/admin/territories')

    return {
      success: true,
      data: updatedAssignment,
      message: `Territorio ${assignment.territory.number} devuelto por ${assignment.driver.name}`,
    }
  } catch (error) {
    console.error('Error al devolver asignación:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al devolver la asignación',
    }
  }
}

export async function deleteAssignment(assignmentId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    await prisma.block.updateMany({
      where: { assignmentId },
      data: { assignmentId: null },
    })
    await prisma.assignment.delete({ where: { id: assignmentId } })

    revalidatePath('/dashboard')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/admin/territories')

    return { success: true, message: 'Asignación eliminada correctamente' }
  } catch (error) {
    console.error('Error al eliminar asignación:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error al eliminar la asignación',
    }
  }
}

export async function getCompletedAssignmentsHistory() {
  try {
    const tenantId = await getCurrentTenantId()
    const completedAssignments = await prisma.assignment.findMany({
      where: tenantFilter(tenantId, { isCompleted: true }),
      include: {
        territory: true,
        driver: { include: { group: true } },
      },
      orderBy: { endDate: 'desc' },
    })
    return { success: true, data: completedAssignments }
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return { success: false, data: [], message: 'Error al obtener el historial de asignaciones' }
  }
}

export async function updateAssignment(
  assignmentId: string,
  data: { driverId?: string; startDate?: Date; endDate?: Date }
) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { territory: true, driver: true },
    })
    if (!assignment) throw new Error('Asignación no encontrada')

    if (data.driverId) {
      const driver = await prisma.driver.findUnique({ where: { id: data.driverId } })
      if (!driver) throw new Error('Conductor no encontrado')
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { driverId: data.driverId, startDate: data.startDate, endDate: data.endDate },
      include: { territory: true, driver: { include: { group: true } } },
    })

    revalidatePath('/admin/history')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/territories')

    return { success: true, data: updated, message: 'Asignación actualizada correctamente' }
  } catch (error) {
    console.error('Error al actualizar asignación:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al actualizar la asignación',
    }
  }
}
