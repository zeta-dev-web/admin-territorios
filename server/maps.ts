'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentTenantId } from '@/lib/tenant'
import { convertGoogleDriveUrl } from '@/lib/google-drive'

export async function createOrUpdateMap(
  type: 'GENERAL' | 'GROUP',
  images: string[],
  groupId?: string
) {
  try {
    const tenantId = await getCurrentTenantId()

    if (images.length === 0) {
      throw new Error('Debes proporcionar al menos una imagen')
    }

    const existing = await prisma.territoryMap.findFirst({
      where: {
        type,
        groupId: groupId || null,
        tenantId,
      },
      include: { images: true },
    })

    // Convertir URLs de Google Drive a formato directo de imagen
    const convertedImages = images.map(convertGoogleDriveUrl)

    let map
    if (existing) {
      // Eliminar imágenes viejas y crear las nuevas
      await prisma.mapImage.deleteMany({ where: { mapId: existing.id } })
      map = await prisma.territoryMap.update({
        where: { id: existing.id },
        data: {
          images: {
            create: convertedImages.map((url, i) => ({
              url,
              order: i,
            })),
          },
        },
        include: {
          images: { orderBy: { order: 'asc' } },
        },
      })
    } else {
      map = await prisma.territoryMap.create({
        data: {
          type,
          groupId,
          tenantId,
          images: {
            create: convertedImages.map((url, i) => ({
              url,
              order: i,
            })),
          },
        },
        include: {
          images: { orderBy: { order: 'asc' } },
        },
      })
    }

    revalidatePath('/admin/maps')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: map,
      message: 'Mapa guardado correctamente',
    }
  } catch (error) {
    console.error('Error al guardar mapa:', error)
    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Error al guardar el mapa',
    }
  }
}

export async function getAllMaps() {
  try {
    const tenantId = await getCurrentTenantId()
    const maps = await prisma.territoryMap.findMany({
      where: { tenantId },
      include: {
        images: { orderBy: { order: 'asc' } },
      },
      orderBy: [{ type: 'asc' }, { groupId: 'asc' }],
    })

    return {
      success: true,
      data: maps,
    }
  } catch (error) {
    console.error('Error al obtener mapas:', error)
    return {
      success: false,
      data: [],
      message: 'Error al obtener los mapas',
    }
  }
}

export async function getMapByType(type: 'GENERAL' | 'GROUP', groupId?: string) {
  try {
    const tenantId = await getCurrentTenantId()
    const map = await prisma.territoryMap.findFirst({
      where: {
        type,
        groupId: groupId || null,
        tenantId,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
      },
    })

    return {
      success: true,
      data: map,
    }
  } catch (error) {
    console.error('Error al obtener mapa:', error)
    return {
      success: false,
      data: null,
      message: 'Error al obtener el mapa',
    }
  }
}

export async function deleteMap(mapId: string) {
  try {
    const tenantId = await getCurrentTenantId()
    await prisma.territoryMap.delete({
      where: { id: mapId },
    })

    revalidatePath('/admin/maps')
    revalidatePath('/dashboard')

    return {
      success: true,
      message: 'Mapa eliminado correctamente',
    }
  } catch (error) {
    console.error('Error al eliminar mapa:', error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : 'Error al eliminar el mapa',
    }
  }
}
