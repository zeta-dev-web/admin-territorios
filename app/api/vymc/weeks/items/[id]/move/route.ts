import { NextRequest, NextResponse } from 'next/server'
import { authorizeModuleRequest } from '@/lib/module-access'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// PATCH /api/vymc/weeks/items/[id]/move - Intercambia el orden con otro tema de la misma sección
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const access = await authorizeModuleRequest('VYMC')
    if ('response' in access) return access.response
    const { tenantId } = access
    const { id } = await ctx.params
    const { swapWithItemId } = await request.json()

    if (!swapWithItemId || typeof swapWithItemId !== 'string' || swapWithItemId === id) {
      return NextResponse.json({ error: 'Tema a intercambiar no válido' }, { status: 400 })
    }

    const items = await prisma.weekItem.findMany({
      where: { id: { in: [id, swapWithItemId] } },
      select: {
        id: true,
        order: true,
        weekSectionId: true,
        weekSection: { select: { week: { select: { tenantId: true } } } },
      },
    })

    if (items.length !== 2) {
      return NextResponse.json({ error: 'Tema no encontrado' }, { status: 404 })
    }
    const [a, b] = items
    if (
      a.weekSection.week.tenantId !== tenantId ||
      b.weekSection.week.tenantId !== tenantId ||
      a.weekSectionId !== b.weekSectionId
    ) {
      return NextResponse.json({ error: 'Los temas deben ser de la misma sección' }, { status: 400 })
    }

    await prisma.$transaction([
      prisma.weekItem.update({ where: { id: a.id }, data: { order: -1 } }),
      prisma.weekItem.update({ where: { id: b.id }, data: { order: a.order } }),
      prisma.weekItem.update({ where: { id: a.id }, data: { order: b.order } }),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al mover el tema' }, { status: 500 })
  }
}
