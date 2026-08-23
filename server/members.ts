'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { splitFullName } from '@/lib/name-utils'

// ════════════════════════════════════════════════════════════════
// INTEGRANTES → ahora opera sobre la entidad unificada Publisher.
// Las firmas y formas de respuesta se conservan para no romper
// la web ni la API mobile (Fase 4 del plan de unificación).
// ════════════════════════════════════════════════════════════════

/** Nombre completo visible a partir de firstName + lastName. */
function fullName(publisher: { firstName: string; lastName: string }): string {
  return `${publisher.firstName} ${publisher.lastName}`.trim()
}

/** Agrega el campo `name` calculado a un publicador para compatibilidad. */
function withName<T extends { firstName: string; lastName: string }>(publisher: T) {
  return { ...publisher, name: fullName(publisher) }
}

/**
 * Crea un nuevo integrante en un grupo
 */
export async function createMember(name: string, groupId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const { firstName, lastName } = splitFullName(name)

    const publisher = await prisma.publisher.create({
      data: {
        firstName,
        lastName,
        groupId,
        tenantId,
      },
    })

    revalidatePath('/admin/groups')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: withName(publisher),
      message: `Integrante "${fullName(publisher)}" agregado correctamente`,
    }
  } catch (error) {
    console.error('Error al crear integrante:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al crear el integrante',
    }
  }
}

/**
 * Obtiene todos los integrantes de un grupo
 */
export async function getMembersByGroup(groupId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const publishers = await prisma.publisher.findMany({
      where: {
        groupId,
        tenantId,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return {
      success: true,
      data: publishers.map(withName),
    }
  } catch (error) {
    console.error('Error al obtener integrantes:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener los integrantes',
    }
  }
}

/**
 * Actualiza un integrante
 */
export async function updateMember(
  memberId: string,
  name: string,
  groupId?: string
) {
  try {
    const { firstName, lastName } = splitFullName(name)
    const data: { firstName: string; lastName: string; groupId?: string } = {
      firstName,
      lastName,
    }

    if (groupId) {
      data.groupId = groupId
    }

    const publisher = await prisma.publisher.update({
      where: { id: memberId },
      data,
    })

    revalidatePath('/admin/groups')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: withName(publisher),
      message: 'Integrante actualizado correctamente',
    }
  } catch (error) {
    console.error('Error al actualizar integrante:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al actualizar el integrante',
    }
  }
}

/**
 * Activa o desactiva un integrante como conductor del grupo.
 * Ahora alterna el flag `isConductor` sobre el mismo Publisher:
 * una persona se crea una sola vez (plan de unificación, Fase 4.5).
 */
export async function toggleMemberDriver(
  memberId: string,
  groupId: string,
  memberName: string
) {
  try {
    void groupId // el grupo ya está implícito en el Publisher

    const publisher = await prisma.publisher.findUnique({
      where: { id: memberId },
    })

    if (!publisher) {
      throw new Error('Integrante no encontrado')
    }

    if (publisher.isConductor) {
      // Verificar que no tenga asignaciones territoriales activas
      const activeAssignments = await prisma.assignment.findMany({
        where: {
          publisherId: publisher.id,
          isCompleted: false,
        },
        include: { territory: { select: { number: true } } },
      })

      if (activeAssignments.length > 0) {
        const territoryNumbers = activeAssignments
          .map((a) => a.territory.number)
          .join(', ')
        throw new Error(
          `No se puede quitar a "${memberName}" como conductor porque tiene ${activeAssignments.length} asignación(es) activa(s): Territorio(s) ${territoryNumbers}`
        )
      }

      await prisma.publisher.update({
        where: { id: publisher.id },
        data: { isConductor: false },
      })
      revalidatePath('/admin/groups')
      revalidatePath('/admin/drivers')
      revalidatePath('/dashboard')
      return {
        success: true,
        wasAdded: false,
        message: `${memberName} ya no es conductor`,
      }
    } else {
      await prisma.publisher.update({
        where: { id: publisher.id },
        data: { isConductor: true },
      })
      revalidatePath('/admin/groups')
      revalidatePath('/admin/drivers')
      revalidatePath('/dashboard')
      return {
        success: true,
        wasAdded: true,
        message: `${memberName} ahora es conductor`,
      }
    }
  } catch (error) {
    console.error('Error al cambiar estado de conductor:', error)
    return {
      success: false,
      wasAdded: false,
      message:
        error instanceof Error
          ? error.message
          : 'Error al cambiar estado de conductor',
    }
  }
}

/**
 * Elimina un integrante
 */
export async function deleteMember(memberId: string) {
  try {
    await prisma.publisher.delete({
      where: { id: memberId },
    })

    revalidatePath('/admin/groups')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Integrante eliminado correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar integrante:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Error al eliminar el integrante',
    }
  }
}

export async function getAllMembersForSelect() {
  try {
    const tenantId = await getCurrentTenantId()
    const publishers = await prisma.publisher.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        group: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    })

    return {
      success: true,
      data: publishers.map((p) => ({
        id: p.id,
        name: fullName(p),
        group: p.group,
      })),
    }
  } catch (error) {
    console.error('Error al obtener miembros:', error)
    return {
      success: false,
      data: [],
    }
  }
}
