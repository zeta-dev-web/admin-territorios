import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// DELETE /api/vymc/assignments/[id] - atómico y scopeado por congregación
export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params

    const deleted = await prisma.meetingAssignment.deleteMany({
      where: {
        id,
        weekItem: { weekSection: { week: { tenantId } } },
      },
    })

    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Asignación no encontrada' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al eliminar asignación' }, { status: 500 })
  }
}
