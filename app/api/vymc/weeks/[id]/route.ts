import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { isLeadershipPublisher } from '@/lib/assignment-eligibility'

export const dynamic = 'force-dynamic'

function noAuth(e: unknown) {
  return e instanceof Error && e.message === 'No autenticado'
}

async function loadWeek(id: string, tenantId: string) {
  return prisma.week.findFirst({
    where: { id, tenantId },
    include: {
      president: { select: { id: true, firstName: true, lastName: true, phone: true } },
      openingPrayer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      sections: {
        orderBy: { order: 'asc' },
        include: {
          items: {
            orderBy: { order: 'asc' },
            include: { assignments: { include: { publisher: true } } },
          },
        },
      },
    },
  })
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params
    const week = await loadWeek(id, tenantId)
    if (!week) return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 })
    return NextResponse.json(week)
  } catch (e) {
    if (noAuth(e)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    console.error(e); return NextResponse.json({ error: 'Error al obtener semana' }, { status: 500 })
  }
}

// PUT: presidente / oración inicial (con validación de liderazgo)
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params
    const body = await request.json()

    const week = await prisma.week.findFirst({ where: { id, tenantId } })
    if (!week) return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 })
    if (week.weekType !== 'REGULAR') {
      return NextResponse.json({ error: 'Las semanas especiales no admiten asignaciones' }, { status: 400 })
    }

    const data: Record<string, string | null> = {}
    for (const field of ['presidentId', 'openingPrayerId'] as const) {
      if (body[field] === undefined) continue
      if (body[field] === null) { data[field] = null; continue }
      const publisher = await prisma.publisher.findFirst({
        where: { id: body[field], tenantId },
      })
      if (!publisher || !isLeadershipPublisher(publisher)) {
        return NextResponse.json(
          { error: 'La presidencia y las oraciones solo pueden asignarse a ancianos o siervos ministeriales' },
          { status: 400 }
        )
      }
      data[field] = body[field]
    }

    const updated = await prisma.week.update({ where: { id }, data })
    void updated
    const fresh = await loadWeek(id, tenantId)
    return NextResponse.json(fresh)
  } catch (e) {
    if (noAuth(e)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    console.error(e); return NextResponse.json({ error: 'Error al actualizar semana' }, { status: 500 })
  }
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params
    const week = await prisma.week.findFirst({ where: { id, tenantId }, select: { id: true } })
    if (!week) return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 })
    await prisma.week.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e) {
    if (noAuth(e)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    console.error(e); return NextResponse.json({ error: 'Error al eliminar semana' }, { status: 500 })
  }
}
