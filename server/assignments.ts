'use server'

import { prisma } from '@/lib/prisma'
import { CreateAssignmentInput, UpdateAssignmentInput } from '@/types'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { tenantFilter } from '@/lib/scoped-prisma'

// ════════════════════════════════════════════════════════════════
// ASIGNACIONES TERRITORIALES → conductor = Publisher (isConductor).
// Escribe únicamente publisherId; las respuestas exponen el alias
// `driver` con `name` computado para compatibilidad con web/mobile.
// ════════════════════════════════════════════════════════════════

function fullName(publisher: { firstName: string; lastName: string }): string {
  return `${publisher.firstName} ${publisher.lastName}`.trim()
}

/** Alias de compatibilidad: publisher → driver conservando el resto de props. */
function withDriverAlias<T extends { publisher: { firstName: string; lastName: string } | null }>(
  assignment: T
): Omit<T, 'publisher'> & {
  driver: { name: string } | null
} {
  const { publisher, ...rest } = assignment
  return {
    ...rest,
    driver: publisher ? { ...publisher, name: `${publisher.firstName} ${publisher.lastName}`.trim() } : null,
  }
}

function revalidateAssignmentPaths(territoryIds: string[] = []) {
  revalidatePath('/territorios')
  territoryIds.forEach((territoryId) => revalidatePath(`/territorios/${territoryId}`))
  revalidatePath('/territorios/asignaciones')
  revalidatePath('/territorios/historial')
  revalidatePath('/territorios/lista')
}

export async function createAssignment(input: CreateAssignmentInput) {
  try {
    const tenantId = await getCurrentTenantId()

    const territory = await prisma.territory.findFirst({
      where: { id: input.territoryId, tenantId },
      include: { blocks: true },
    })
    if (!territory) throw new Error(`Territorio con ID ${input.territoryId} no encontrado`)

    // El ID que llega es un publicador con capacidad de conductor
    const publisher = await prisma.publisher.findFirst({
      where: { id: input.driverId, tenantId, isConductor: true },
      include: { group: true },
    })
    if (!publisher) throw new Error(`Conductor con ID ${input.driverId} no encontrado`)

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
        publisherId: input.driverId,
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
        publisher: { include: { group: true } },
        blocks: true,
      },
    })

    revalidateAssignmentPaths([input.territoryId])

    return {
      success: true,
      data: withDriverAlias(assignment),
      message: `Asignación creada: Territorio ${territory.number} asignado a ${fullName(publisher)}`,
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

const ASSIGNMENT_INCLUDE = {
  territory: true,
  publisher: { include: { group: true } },
} as const

export async function getActiveAssignments() {
  try {
    const tenantId = await getCurrentTenantId()
    const assignments = await prisma.assignment.findMany({
      where: tenantFilter(tenantId, { isCompleted: false }),
      include: {
        ...ASSIGNMENT_INCLUDE,
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

    return { success: true, data: assignmentsWithProgress.map(withDriverAlias) }
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
        publisher: { include: { group: true } },
        blocks: {
          include: { dailyRecords: { orderBy: { date: 'desc' }, take: 1 } },
        },
        dailyRecords: {
          include: { publisher: true, block: true },
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!assignment) throw new Error(`Asignación con ID ${assignmentId} no encontrada`)
    return { success: true, data: withDriverAlias(assignment) }
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
      include: { territory: true, publisher: true, _count: { select: { blocks: true } } },
    })
    if (!assignment) throw new Error('Asignación no encontrada')
    if (assignment.isCompleted) throw new Error('Esta asignación ya está completada')

    const totalBlocks = assignment._count.blocks
    const workedBlocks = await prisma.block.count({
      where: { assignmentId: assignment.id, dailyRecords: { some: { assignmentId: assignment.id } } },
    })
    if (workedBlocks < totalBlocks) {
      throw new Error(
        `No se puede completar la asignación. Faltan ${totalBlocks - workedBlocks} manzanas por trabajar (${workedBlocks}/${totalBlocks} completadas)`
      )
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isCompleted: true, endDate: new Date() },
      include: { territory: true, publisher: true },
    })

    revalidatePath('/territorios')
    revalidatePath('/territorios/asignaciones')
    revalidatePath('/territorios/historial')
    revalidatePath('/territorios/lista')
    return {
      success: true,
      data: withDriverAlias(updatedAssignment),
      message: `Asignación completada: Territorio ${assignment.territory.number} por ${assignment.publisher ? fullName(assignment.publisher) : '—'}`,
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
      include: { territory: true, publisher: true },
    })
    if (!assignment) throw new Error('Asignación no encontrada')
    if (assignment.isCompleted) throw new Error('Esta asignación ya fue completada o devuelta')

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { isCompleted: true, endDate: returnDate || new Date() },
      include: { territory: true, publisher: true },
    })

    revalidatePath('/territorios')
    revalidatePath('/territorios/asignaciones')
    revalidatePath('/territorios/historial')
    revalidatePath('/territorios/lista')
    return {
      success: true,
      data: withDriverAlias(updatedAssignment),
      message: `Territorio ${assignment.territory.number} devuelto por ${assignment.publisher ? fullName(assignment.publisher) : '—'}`,
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
      await tx.block.updateMany({ where: { assignmentId, tenantId }, data: { assignmentId: null } })
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
      include: { territory: true, publisher: { include: { group: true } } },
      orderBy: { endDate: 'desc' },
    })
    return { success: true, data: completedAssignments.map(withDriverAlias) }
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
      include: ASSIGNMENT_INCLUDE,
    })
    if (!assignment) throw new Error('Asignación no encontrada')

    if (data.driverId) {
      const publisher = await prisma.publisher.findFirst({
        where: { id: data.driverId, tenantId, isConductor: true },
      })
      if (!publisher) throw new Error('Conductor no encontrado')
    }

    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        publisherId: data.driverId,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: { ...ASSIGNMENT_INCLUDE },
    })
    revalidatePath('/territorios/historial')
    revalidatePath('/territorios/asignaciones')
    revalidatePath('/territorios/lista')
    return { success: true, data: withDriverAlias(updated), message: 'Asignación actualizada correctamente' }
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
    const driverId = data.driverId ?? assignment.publisherId
    const startDate = data.startDate ?? assignment.startDate
    const territoryChanged = territoryId !== assignment.territoryId
    if (territoryChanged && data.blockWork === undefined) {
      throw new Error('Indicá el estado de las manzanas al cambiar de territorio')
    }
    const [driver, territory, conflictingDriverAssignment, conflictingPersonalAssignment] =
      await Promise.all([
        prisma.publisher.findFirst({ where: { id: driverId ?? '', tenantId } }),
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
      } else if (driverId !== assignment.publisherId) {
        await tx.dailyRecord.updateMany({
          where: { assignmentId, tenantId },
          data: { publisherId: driverId },
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
          publisherId: driverId,
          startDate,
          endDate: shouldReconcileBlocks
            ? (completesAssignment ? lastWorkDate : null)
            : undefined,
          isCompleted: shouldReconcileBlocks ? completesAssignment : undefined,
        },
        include: { territory: true, publisher: { include: { group: true } } },
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
            publisherId: driverId!,
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
      data: withDriverAlias(updated),
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
