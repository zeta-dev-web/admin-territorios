import { NextRequest, NextResponse } from 'next/server'
import { authorizeModuleRequest } from '@/lib/module-access'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/vymc/weeks/sections/[sectionId]/items - Agrega un tema extra a una sección existente
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ sectionId: string }> }
) {
  try {
    const access = await authorizeModuleRequest('VYMC')
    if ('response' in access) return access.response
    const { tenantId } = access
    const { sectionId } = await ctx.params
    const body = await request.json()
    const title = String(body.title ?? '').trim()
    const rawMinutes = body.timeMinutes

    if (!title) {
      return NextResponse.json({ error: 'El título es requerido' }, { status: 400 })
    }

    let timeMinutes: number | null = null
    if (rawMinutes !== undefined && rawMinutes !== null && String(rawMinutes).trim() !== '') {
      const parsed = Number(rawMinutes)
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 999) {
        return NextResponse.json({ error: 'Los minutos deben ser un número entre 0 y 999' }, { status: 400 })
      }
      timeMinutes = Math.round(parsed)
    }

    const section = await prisma.weekSection.findFirst({
      where: { id: sectionId, week: { tenantId } },
      select: { id: true, weekId: true },
    })
    if (!section) {
      return NextResponse.json({ error: 'Sección no encontrada' }, { status: 404 })
    }

    const maxOrder = await prisma.weekItem.aggregate({
      where: { weekSectionId: sectionId },
      _max: { order: true },
    })

    const created = await prisma.weekItem.create({
      data: {
        weekSectionId: sectionId,
        title,
        itemType: 'DISCUSSION',
        order: (maxOrder._max.order ?? 0) + 1,
        timeMinutes,
        requiresStudentHelper: false,
      },
      include: { assignments: { include: { publisher: true } } },
    })

    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al agregar el tema' }, { status: 500 })
  }
}
