import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/vymc/weeks/items/[id] - Renombra el título de una parte
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params
    const { title } = await request.json()

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    const item = await prisma.weekItem.findFirst({
      where: { id },
      select: { id: true, weekSection: { select: { week: { select: { tenantId: true } } } } },
    })
    if (!item || item.weekSection.week.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Parte no encontrada' }, { status: 404 })
    }

    const updated = await prisma.weekItem.update({
      where: { id },
      data: { title: String(title).trim() },
    })
    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al actualizar la parte' }, { status: 500 })
  }
}
