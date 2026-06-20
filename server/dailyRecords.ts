'use server'

import { prisma } from '@/lib/prisma'
import { CreateDailyRecordInput } from '@/types'
import { revalidatePath } from 'next/cache'

/**
 * Crea un nuevo registro de trabajo diario
 * @param input - Datos del registro (assignmentId, driverId, blockId, date, notes)
 * @returns El registro creado y el estado de la asignación
 */
export async function createDailyRecord(input: CreateDailyRecordInput) {
  try {
    // 1. Validar la existencia de la asignación
    const assignment = await prisma.assignment.findUnique({
      where: { id: input.assignmentId },
      include: {
        blocks: true,
        territory: true,
      },
    })

    if (!assignment) {
      throw new Error(`Asignación con ID ${input.assignmentId} no encontrada`)
    }

    if (assignment.isCompleted) {
      throw new Error('No se puede registrar trabajo en una asignación completada')
    }

    // 2. Validar la existencia del conductor
    const driver = await prisma.driver.findUnique({
      where: { id: input.driverId },
    })

    if (!driver) {
      throw new Error(`Conductor con ID ${input.driverId} no encontrado`)
    }

    // 3. Validar que el bloque pertenece a esta asignación
    const block = assignment.blocks.find((b) => b.id === input.blockId)

    if (!block) {
      throw new Error(
        `El bloque ${input.blockId} no pertenece a esta asignación`
      )
    }

    // 4. Verificar si ya existe un registro para este bloque en esta fecha
    const existingRecord = await prisma.dailyRecord.findFirst({
      where: {
        assignmentId: input.assignmentId,
        blockId: input.blockId,
        date: {
          gte: new Date(input.date.setHours(0, 0, 0, 0)),
          lt: new Date(input.date.setHours(23, 59, 59, 999)),
        },
      },
    })

    if (existingRecord) {
      throw new Error(
        `Ya existe un registro para el bloque ${block.letter} en esta fecha`
      )
    }

    // 5. Crear el registro diario
    const dailyRecord = await prisma.dailyRecord.create({
      data: {
        assignmentId: input.assignmentId,
        driverId: input.driverId,
        blockId: input.blockId,
        date: input.date,
        notes: input.notes,
      },
      include: {
        block: true,
        driver: true,
        assignment: {
          include: {
            territory: true,
          },
        },
      },
    })

    // 6. Verificar si todas las manzanas están completadas
    const completedBlocks = await prisma.dailyRecord.groupBy({
      by: ['blockId'],
      where: {
        assignmentId: input.assignmentId,
      },
      _count: {
        blockId: true,
      },
    })

    const totalBlocks = assignment.blocks.length
    const completedBlocksCount = completedBlocks.length

    // 7. Si todas las manzanas están completadas, marcar la asignación como completada
    let updatedAssignment = null
    if (completedBlocksCount === totalBlocks) {
      // Obtener la fecha del último registro
      const lastRecord = await prisma.dailyRecord.findFirst({
        where: {
          assignmentId: input.assignmentId,
        },
        orderBy: {
          date: 'desc',
        },
      })

      updatedAssignment = await prisma.assignment.update({
        where: { id: input.assignmentId },
        data: {
          isCompleted: true,
          endDate: lastRecord?.date || new Date(),
        },
        include: {
          territory: true,
          driver: true,
        },
      })
    }

    // 8. Revalidar rutas
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${assignment.territoryId}`)
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/admin/territories')

    return {
      success: true,
      data: {
        dailyRecord,
        assignment: updatedAssignment,
        isAssignmentCompleted: !!updatedAssignment,
        progress: {
          completedBlocks: completedBlocksCount,
          totalBlocks,
          percentage: Math.round((completedBlocksCount / totalBlocks) * 100),
        },
      },
      message: updatedAssignment
        ? `¡Asignación completada! Territorio ${assignment.territory.number} finalizado.`
        : `Trabajo registrado: Manzana ${block.letter} (${completedBlocksCount}/${totalBlocks})`,
    }
  } catch (error) {
    console.error('Error al crear registro diario:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : 'Error desconocido al crear el registro',
    }
  }
}

/**
 * Obtiene todos los registros diarios de una asignación
 */
export async function getDailyRecordsByAssignment(assignmentId: string) {
  try {
    const records = await prisma.dailyRecord.findMany({
      where: {
        assignmentId,
      },
      include: {
        block: true,
        driver: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    return {
      success: true,
      data: records,
    }
  } catch (error) {
    console.error('Error al obtener registros diarios:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener los registros diarios',
    }
  }
}

/**
 * Obtiene los registros de trabajo de un conductor específico
 */
export async function getDailyRecordsByDriver(
  driverId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const records = await prisma.dailyRecord.findMany({
      where: {
        driverId,
        ...(startDate &&
          endDate && {
            date: {
              gte: startDate,
              lte: endDate,
            },
          }),
      },
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
    })

    return {
      success: true,
      data: records,
    }
  } catch (error) {
    console.error('Error al obtener registros del conductor:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener los registros del conductor',
    }
  }
}

/**
 * Elimina un registro diario (por si se registró por error)
 */
export async function deleteDailyRecord(recordId: string) {
  try {
    const record = await prisma.dailyRecord.findUnique({
      where: { id: recordId },
      include: {
        assignment: {
          include: {
            territory: true,
          },
        },
      },
    })

    if (!record) {
      throw new Error(`Registro con ID ${recordId} no encontrado`)
    }

    // Si la asignación estaba completada, revertirla
    if (record.assignment.isCompleted) {
      await prisma.assignment.update({
        where: { id: record.assignmentId },
        data: {
          isCompleted: false,
          endDate: null,
        },
      })
    }

    await prisma.dailyRecord.delete({
      where: { id: recordId },
    })

    // Revalidar rutas
    revalidatePath('/dashboard')
    revalidatePath(`/dashboard/${record.assignment.territoryId}`)
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/admin/territories')

    return {
      success: true,
      message: 'Registro eliminado correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar registro:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Error al eliminar el registro',
    }
  }
}
