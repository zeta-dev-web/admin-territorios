'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'

// ════════════════════════════════════════════════════════════════
// ASIGNACIONES PERSONALES → la persona es un Publisher.
// Escribe únicamente publisherId; las respuestas exponen el alias
// `member` con name computado para compatibilidad con web/mobile.
// ════════════════════════════════════════════════════════════════

function fullName(publisher: { firstName: string; lastName: string }): string {
  return `${publisher.firstName} ${publisher.lastName}`.trim()
}

/** Alias de compatibilidad: publisher → member conservando el resto de props. */
function withMemberAlias<T extends { publisher: { firstName: string; lastName: string } | null }>(
  assignment: T
): Omit<T, 'publisher'> & {
  member: { name: string } | null
} {
  const { publisher, ...rest } = assignment
  return {
    ...rest,
    member: publisher ? { ...publisher, name: `${publisher.firstName} ${publisher.lastName}`.trim() } : null,
  }
}

/**
 * Crea una asignación personal de territorio a un publicador
 */
export async function createPersonalAssignment(
  territoryId: string,
  memberId: string,
  notes?: string,
  assignedDate?: Date
) {
  try {
    const tenantId = await getCurrentTenantId()

    // Verificar que el territorio existe
    const territory = await prisma.territory.findFirst({
      where: { id: territoryId, tenantId },
    })

    if (!territory) {
      throw new Error('Territorio no encontrado')
    }

    // Verificar que el publicador existe
    const publisher = await prisma.publisher.findFirst({
      where: { id: memberId, tenantId },
      include: { group: true },
    })

    if (!publisher) {
      throw new Error('Integrante no encontrado')
    }

    // Verificar si el territorio ya está asignado a alguien
    const existingAssignment = await prisma.personalAssignment.findFirst({
      where: {
        territoryId,
        isActive: true,
        tenantId,
      },
      include: {
        publisher: true,
      },
    })

    if (existingAssignment?.publisher) {
      throw new Error(
        `El territorio ya está asignado a ${fullName(existingAssignment.publisher)}`
      )
    }

    const personalAssignment = await prisma.personalAssignment.create({
      data: {
        territoryId,
        publisherId: memberId,
        notes,
        assignedDate: assignedDate || new Date(),
        tenantId,
      },
      include: {
        territory: true,
        publisher: {
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
      data: withMemberAlias(personalAssignment),
      message: `Territorio ${territory.number} asignado a ${fullName(publisher)}`,
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
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.personalAssignment.findFirst({
      where: { id: assignmentId, tenantId },
      include: {
        territory: true,
        publisher: true,
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
        publisher: true,
      },
    })
    revalidatePath('/admin/territories')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/dashboard')
    return {
      success: true,
      data: withMemberAlias(updatedAssignment),
      message: `Territorio ${assignment.territory.number} devuelto por ${assignment.publisher ? fullName(assignment.publisher) : '—'}`,
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
    const tenantId = await getCurrentTenantId()
    const assignments = await prisma.personalAssignment.findMany({
      where: {
        isActive: true,
        tenantId,
      },
      include: {
        territory: true,
        publisher: {
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
      data: assignments.map(withMemberAlias),
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
    const tenantId = await getCurrentTenantId()
    const assignments = await prisma.personalAssignment.findMany({
      where: {
        territoryId,
        tenantId,
      },
      include: {
        publisher: {
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
      data: assignments.map(withMemberAlias),
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
 * Obtiene el historial de asignaciones personales de una persona
 */
export async function getPersonalAssignmentsByMember(memberId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignments = await prisma.personalAssignment.findMany({
      where: {
        publisherId: memberId,
        tenantId,
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
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.personalAssignment.findFirst({
      where: { id: assignmentId, tenantId },
      select: { id: true },
    })
    if (!assignment) throw new Error('Asignación no encontrada')
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
      message:
        error instanceof Error ? error.message : 'Error al eliminar la asignación',
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
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.personalAssignment.findFirst({
      where: { id: assignmentId, tenantId },
      include: { territory: true, publisher: true },
    })
    if (!assignment) {
      throw new Error('Asignación no encontrada')
    }
    if (data.memberId) {
      const publisher = await prisma.publisher.findFirst({
        where: { id: data.memberId, tenantId },
      })
      if (!publisher) {
        throw new Error('Integrante no encontrado')
      }
    }
    const updated = await prisma.personalAssignment.update({
      where: { id: assignmentId },
      data: {
        publisherId: data.memberId,
        assignedDate: data.assignedDate,
        returnedDate: data.returnedDate,
      },
      include: {
        territory: true,
        publisher: {
          include: { group: true },
        },
      },
    })
    revalidatePath('/admin/history')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/territories')
    return {
      success: true,
      data: withMemberAlias(updated),
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

export async function updateActivePersonalAssignment(
  assignmentId: string,
  data: {
    territoryId?: string
    memberId?: string
    assignedDate?: Date
    notes?: string
  }
) {
  try {
    const tenantId = await getCurrentTenantId()
    const assignment = await prisma.personalAssignment.findFirst({
      where: { id: assignmentId, tenantId, isActive: true },
    })
    if (!assignment) throw new Error('Asignación personal activa no encontrada')
    const territoryId = data.territoryId ?? assignment.territoryId
    const memberId = data.memberId ?? assignment.publisherId
    const [publisher, territory, conflictingPersonal, conflictingDriver] = await Promise.all([
      prisma.publisher.findFirst({ where: { id: memberId ?? '', tenantId } }),
      prisma.territory.findFirst({ where: { id: territoryId, tenantId } }),
      prisma.personalAssignment.findFirst({
        where: {
          territoryId,
          tenantId,
          isActive: true,
          id: { not: assignmentId },
        },
      }),
      prisma.assignment.findFirst({
        where: { territoryId, tenantId, isCompleted: false },
      }),
    ])
    if (!publisher) throw new Error('Integrante no encontrado')
    if (!territory) throw new Error('Territorio no encontrado')
    if (conflictingPersonal || conflictingDriver) {
      throw new Error(`El territorio ${territory.number} ya tiene una asignación activa`)
    }
    const updated = await prisma.personalAssignment.update({
      where: { id: assignmentId },
      data: {
        territoryId,
        publisherId: memberId,
        assignedDate: data.assignedDate,
        notes: data.notes,
      },
      include: {
        territory: true,
        publisher: { include: { group: true } },
      },
    })
    revalidatePath('/dashboard')
    revalidatePath('/admin/assignments')
    revalidatePath('/admin/history')
    revalidatePath('/admin/territories')
    return {
      success: true,
      data: withMemberAlias(updated),
      message: 'Asignación personal actualizada correctamente',
    }
  } catch (error) {
    console.error('Error al actualizar asignación personal activa:', error)
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : 'Error al actualizar la asignación personal',
    }
  }
}
