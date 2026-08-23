import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/vymc/weeks/[id]/sections - Crea sección placeholder con su item
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params
    const body = await request.json()

    const week = await prisma.week.findFirst({ where: { id, tenantId }, select: { id: true } })
    if (!week) return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 })

    const count = await prisma.weekSection.count({ where: { weekId: id } })
    const section = await prisma.weekSection.create({
      data: {
        weekId: id,
        sectionType: body.sectionType,
        order: count + 1,
        items: {
          create: (body.items ?? []).map((it: Record<string, unknown>, i: number) => ({
            title: String(it.title ?? ''),
            itemType: it.itemType ?? 'DISCUSSION',
            order: it.order ?? i + 1,
          })),
        },
      },
      include: { items: true },
    })
    return NextResponse.json(section)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al crear sección' }, { status: 500 })
  }
}
