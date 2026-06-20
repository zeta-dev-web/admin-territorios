'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Crea una asignación personal de territorio a un miembro
 */
export async function createPersonalAssignment(
  territoryId: string,
  memberId: string,
  notes?: string,
  assignedDate?: Date
) {
  try {
    // Verificar que el territorio existe
    const territory = await prisma.territory.findUnique({
      where: { id: territoryId },
    })

    if (!territory) {
      throw new Error('Territorio no encontrado')
    }

    // Verificar que el miembro existe
    const member = await prisma.member.findUnique({
      where: { id: memberId },
      include: { group: true },
    })

    if (!member) {
      throw new Error('Miembro no encontrado')
    }

    // Verificar si el territorio ya está asignado a alguien
    const existingAssignment = await prisma.personalAssignment.findFirst({
      where: {
        territoryId,
        isActive: true,
      },
      include: {
        member: true,
      },
    })

    if (existingAssignment) {
      throw new Error(
        `El territorio ya está asignado a ${existingAssignment.member.name}`
      )
    }

    const personalAssignment = await prisma.personalAssignment.create({
      data: {
        territoryId,
        memberId,
        notes,
        assignedDate: assignedDate || new Date(),
      },
      include: {
        territory: true,
        member: {
          include: {
            group: true,
          },
        },
      },
    })

    revalidatePath('/admin/territories')
    revalidatePath('/admin/assignments')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: personalAssignment,
      message: `Territorio ${territory.number} asignado a ${member.name}`,
    }
  } catch (error) {
    console.error('Error al crear asignación personal:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : 'Error al crear la asignación personal',
    }
  }
}

/**
 * Marca una asignación personal como devuelta
 * @param returnDate - Fecha opcional de devolución (por defecto: hoy)
 */
export async function returnPersonalAssignment(assignmentId: string, returnDate?: Date) {
  try {
    const assignment = await prisma.personalAssignment.findUnique({
      where: { id: assignmentId },
      include: {
        territory: true,
        member: true,
      },
    })

    if (!assignment) {
      throw new Error('Asignación no encontrada')
    }

    if (!assignment.isActive) {
      throw new Error('Esta asignación ya fue devuelta')
    }

    const updatedAssignment = await prisma.personalAssignment.update({
      where: { id: assignmentId },
      data: {
        returnedDate: returnDate || new Date(),
        isActive: false,
      },
      include: {
        territory: true,
        member: true,
      },
    })

    revalidatePath('/admin/territories')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: updatedAssignment,
      message: `Territorio ${assignment.territory.number} devuelto por ${assignment.member.name}`,
    }
  } catch (error) {
    console.error('Error al devolver asignación personal:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : 'Error al devolver la asignación',
    }
  }
}

/**
 * Obtiene todas las asignaciones personales activas
 */
export async function getActivePersonalAssignments() {
  try {
    const assignments = await prisma.personalAssignment.findMany({
      where: {
        isActive: true,
      },
      include: {
        territory: true,
        member: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        assignedDate: 'desc',
      },
    })

    return {
      success: true,
      data: assignments,
    }
  } catch (error) {
    console.error('Error al obtener asignaciones personales:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener las asignaciones personales',
    }
  }
}

/**
 * Obtiene el historial de asignaciones personales de un territorio
 */
export async function getPersonalAssignmentsByTerritory(territoryId: string) {
  try {
    const assignments = await prisma.personalAssignment.findMany({
      where: {
        territoryId,
      },
      include: {
        member: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        assignedDate: 'desc',
      },
    })

    return {
      success: true,
      data: assignments,
    }
  } catch (error) {
    console.error('Error al obtener asignaciones del territorio:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener las asignaciones',
    }
  }
}

/**
 * Obtiene el historial de asignaciones personales de un miembro
 */
export async function getPersonalAssignmentsByMember(memberId: string) {
  try {
    const assignments = await prisma.personalAssignment.findMany({
      where: {
        memberId,
      },
      include: {
        territory: true,
      },
      orderBy: {
        assignedDate: 'desc',
      },
    })

    return {
      success: true,
      data: assignments,
    }
  } catch (error) {
    console.error('Error al obtener asignaciones del miembro:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener las asignaciones',
    }
  }
}

/**
 * Elimina una asignación personal
 */
export async function deletePersonalAssignment(assignmentId: string) {
  try {
    await prisma.personalAssignment.delete({
      where: { id: assignmentId },
    })

    revalidatePath('/admin/territories')
    revalidatePath('/admin/assignments')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Asignación eliminada correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar asignación personal:', error)
    return {
      success: false,
      message: 'Error al eliminar la asignación',
    }
  }
}

export async function updatePersonalAssignment(
  assignmentId: string,
  data: {
    memberId?: string
    assignedDate?: Date
    returnedDate?: Date
  }
) {
  try {
    const assignment = await prisma.personalAssignment.findUnique({
      where: { id: assignmentId },
      include: { territory: true, member: true },
    })

    if (!assignment) {
      throw new Error('Asignación no encontrada')
    }

    if (data.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: data.memberId },
      })
      if (!member) {
        throw new Error('Miembro no encontrado')
      }
    }

    const updated = await prisma.personalAssignment.update({
      where: { id: assignmentId },
      data: {
        memberId: data.memberId,
        assignedDate: data.assignedDate,
        returnedDate: data.returnedDate,
      },
      include: {
        territory: true,
        member: {
          include: { group: true },
        },
      },
    })

    revalidatePath('/admin/history')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/territories')

    return {
      success: true,
      data: updated,
      message: 'Asignación actualizada correctamente',
    }
  } catch (error) {
    console.error('Error al actualizar asignación personal:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : 'Error al actualizar la asignación',
    }
  }
}
