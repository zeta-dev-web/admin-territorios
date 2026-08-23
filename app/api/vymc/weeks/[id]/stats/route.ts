import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/vymc/weeks/[id]/stats
export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params

    const week = await prisma.week.findFirst({
      where: { id, tenantId },
      select: {
        id: true, weekNumber: true, year: true, isConfirmed: true,
        sections: { select: { items: { select: { assignments: { select: { id: true } } } } } },
      },
    })
    if (!week) return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 })

    const totalSections = week.sections.length
    let totalItems = 0, totalAssignments = 0, itemsWithoutAssignment = 0
    for (const s of week.sections)
      for (const it of s.items) {
        totalItems++
        totalAssignments += it.assignments.length
        if (it.assignments.length === 0) itemsWithoutAssignment++
      }

    return NextResponse.json({
      weekId: week.id, weekNumber: week.weekNumber, year: week.year,
      isConfirmed: week.isConfirmed, totalSections, totalItems,
      totalAssignments, itemsWithoutAssignment,
      completionPercentage: totalItems > 0 ? Math.round(((totalItems - itemsWithoutAssignment) / totalItems) * 100) : 0,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
