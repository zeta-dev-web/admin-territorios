'use server'

import { prisma } from '@/lib/prisma'
import { CreateAssignmentInput, UpdateAssignmentInput } from '@/types'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { tenantFilter } from '@/lib/scoped-prisma'

function revalidateAssignmentPaths(territoryIds: string[] = []) {
  revalidatePath('/dashboard')
  territoryIds.forEach((territoryId) => revalidatePath(`/dashboard/${territoryId}`))
  revalidatePath('/admin/assignments')
  revalidatePath('/admin/history')
  revalidatePath('/admin/territories')
}

export async function createAssignment(input: CreateAssignmentInput) {
  try {
    const tenantId = await getCurrentTenantId()

    const territory = await prisma.territory.findFirst({
      where: { id: input.territoryId, tenantId },
      include: { blocks: true },
    })
    if (!territory) throw new Error(`Territorio con ID ${input.territoryId} no encontrado`)

    const driver = await prisma.driver.findFirst({
      where: { id: input.driverId, tenantId },
      include: { group: true },
    })
    if (!driver) throw new Error(`Conductor con ID ${input.driverId} no encontrado`)

    const existingActiveAssignment = await prisma.assignment.findFirst({
      where: { territoryId: input.territoryId, isCompleted: false, tenantId },
    })
    if (existingActiveAssignment) {
      throw new Error(`El territorio ${territory.number} ya tiene una asignación activa`)
    }

    const blocksToConnect: { id: string }[] = []
    const blocksToCreate: { letter: string; territoryId: string; tenantId: string }[] = []

    for (const letter of input.blockLetters) {
      const existingBlock = territory.blocks.find((b) => b.letter === letter)
      if (existingBlock) {
        blocksToConnect.push({ id: existingBlock.id })
      } else {
        blocksToCreate.push({ letter, territoryId: input.territoryId, tenantId })
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        territoryId: input.territoryId,
        driverId: input.driverId,
        tenantId,
        isCompleted: false,
        startDate: input.startDate || new Date(),
        blocks: {
          connect: blocksToConnect,
          create: blocksToCreate,
        },
      },
      include: {
        territory: true,
        driver: { include: { group: true } },
        blocks: true,
      },
    })

    revalidateAssignmentPaths([input.territoryId])

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
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
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
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
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
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
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
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
      select: { id: true, territoryId: true },
    })
    if (!assignment) throw new Error('Asignación no encontrada')

    await prisma.$transaction(async (tx) => {
      await tx.block.updateMany({
        where: { assignmentId, tenantId },
        data: { assignmentId: null },
      })
      await tx.assignment.delete({ where: { id: assignmentId } })
    })

    revalidateAssignmentPaths([assignment.territoryId])

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
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
      include: { territory: true, driver: true },
    })
    if (!assignment) throw new Error('Asignación no encontrada')

    if (data.driverId) {
      const driver = await prisma.driver.findFirst({ where: { id: data.driverId, tenantId } })
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

export async function updateActiveAssignment(
  assignmentId: string,
  data: UpdateAssignmentInput
) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId, isCompleted: false },
      include: {
        territory: true,
        blocks: true,
      },
    })
    if (!assignment) throw new Error('Asignación activa no encontrada')

    const territoryId = data.territoryId ?? assignment.territoryId
    const driverId = data.driverId ?? assignment.driverId
    const startDate = data.startDate ?? assignment.startDate
    const territoryChanged = territoryId !== assignment.territoryId

    if (territoryChanged && data.blockWork === undefined) {
      throw new Error('Indicá el estado de las manzanas al cambiar de territorio')
    }

    const [driver, territory, conflictingDriverAssignment, conflictingPersonalAssignment] =
      await Promise.all([
        prisma.driver.findFirst({ where: { id: driverId, tenantId } }),
        prisma.territory.findFirst({
          where: { id: territoryId, tenantId },
          include: { blocks: { orderBy: { letter: 'asc' } } },
        }),
        prisma.assignment.findFirst({
          where: {
            territoryId,
            tenantId,
            isCompleted: false,
            id: { not: assignmentId },
          },
        }),
        prisma.personalAssignment.findFirst({
          where: { territoryId, tenantId, isActive: true },
        }),
      ])

    if (!driver) throw new Error('Conductor no encontrado')
    if (!territory) throw new Error('Territorio no encontrado')
    if (conflictingDriverAssignment || conflictingPersonalAssignment) {
      throw new Error(`El territorio ${territory.number} ya tiene una asignación activa`)
    }

    const blockWork = data.blockWork
    const targetBlocks = territoryChanged ? territory.blocks : assignment.blocks
    const targetBlocksByLetter = new Map(targetBlocks.map((block) => [block.letter, block]))
    const uniqueWorkedLetters = new Set<string>()

    if (blockWork) {
      for (const work of blockWork) {
        if (!targetBlocksByLetter.has(work.letter)) {
          throw new Error(`La manzana ${work.letter} no pertenece al territorio ${territory.number}`)
        }
        if (uniqueWorkedLetters.has(work.letter)) {
          throw new Error(`La manzana ${work.letter} está repetida`)
        }
        if (Number.isNaN(work.date.getTime())) {
          throw new Error(`La fecha de la manzana ${work.letter} no es válida`)
        }
        uniqueWorkedLetters.add(work.letter)
      }
    }

    const shouldReconcileBlocks = blockWork !== undefined
    const completesAssignment = Boolean(
      shouldReconcileBlocks &&
      targetBlocks.length > 0 &&
      uniqueWorkedLetters.size === targetBlocks.length
    )
    const lastWorkDate = blockWork?.reduce<Date | null>(
      (latest, work) => (!latest || work.date > latest ? work.date : latest),
      null,
    )

    const updated = await prisma.$transaction(async (tx) => {
      if (territoryChanged || shouldReconcileBlocks) {
        await tx.dailyRecord.deleteMany({ where: { assignmentId, tenantId } })
      } else if (driverId !== assignment.driverId) {
        await tx.dailyRecord.updateMany({
          where: { assignmentId, tenantId },
          data: { driverId },
        })
      }

      if (territoryChanged) {
        await tx.block.updateMany({
          where: { assignmentId, tenantId },
          data: { assignmentId: null },
        })
      }

      const updatedAssignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          territoryId,
          driverId,
          startDate,
          endDate: shouldReconcileBlocks
            ? (completesAssignment ? lastWorkDate : null)
            : undefined,
          isCompleted: shouldReconcileBlocks ? completesAssignment : undefined,
        },
        include: { territory: true, driver: { include: { group: true } } },
      })

      if (territoryChanged) {
        await tx.block.updateMany({
          where: { id: { in: territory.blocks.map((block) => block.id) }, tenantId },
          data: { assignmentId },
        })
      }

      if (blockWork?.length) {
        await tx.dailyRecord.createMany({
          data: blockWork.map((work) => ({
            assignmentId,
            driverId,
            blockId: targetBlocksByLetter.get(work.letter)!.id,
            date: work.date,
            notes: work.notes?.trim() || null,
            tenantId,
          })),
        })
      }

      return updatedAssignment
    })

    revalidateAssignmentPaths([assignment.territoryId, territoryId])

    return {
      success: true,
      data: updated,
      message: completesAssignment
        ? 'Asignación actualizada y completada correctamente'
        : 'Asignación actualizada correctamente',
    }
  } catch (error) {
    console.error('Error al actualizar asignación activa:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al actualizar la asignación',
    }
  }
}
