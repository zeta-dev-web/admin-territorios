'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getCurrentTenantId } from '@/lib/tenant'

export async function createOrUpdateMap(
  type: 'GENERAL' | 'GROUP',
  frontImage: string,
  backImage: string,
  groupId?: string
) {
  try {
    const tenantId = await getCurrentTenantId()

    const existing = await prisma.territoryMap.findFirst({
      where: {
        type,
        groupId: groupId || null,
        tenantId,
      },
    })

    let map
    if (existing) {
      map = await prisma.territoryMap.update({
        where: { id: existing.id },
        data: {
          frontImage,
          backImage,
        },
      })
    } else {
      map = await prisma.territoryMap.create({
        data: {
          type,
          groupId,
          frontImage,
          backImage,
          tenantId,
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
      message: 'Error al guardar el mapa',
    }
  }
}

export async function getAllMaps() {
  try {
    const tenantId = await getCurrentTenantId()
    const maps = await prisma.territoryMap.findMany({
      where: { tenantId },
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
      message: 'Error al eliminar el mapa',
    }
  }
}

export async function uploadMapImage(formData: FormData, filename: string) {
  try {
    const file = formData.get('file') as File
    if (!file) {
      throw new Error('No se proporcionó archivo')
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    const uploadsDir = join(process.cwd(), 'public', 'mapas')
    await mkdir(uploadsDir, { recursive: true })

    const path = join(uploadsDir, filename)
    await writeFile(path, buffer)

    return {
      success: true,
      path: `/mapas/${filename}`,
    }
  } catch (error) {
    console.error('Error al subir imagen:', error)
    return {
      success: false,
      path: null,
      message: 'Error al subir la imagen',
    }
  }
}
