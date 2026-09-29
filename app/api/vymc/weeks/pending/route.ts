import { NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/vymc/weeks/pending - Semanas del mes en curso y el próximo con su
// detalle de partes, para calcular pendientes en el cliente.
// No incluye semanas de asamblea (no llevan asignaciones).
export async function GET() {
  try {
    const tenantId = await getCurrentTenantId()

    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const rangeEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 2, 1))

    const weeks = await prisma.week.findMany({
      where: {
        tenantId,
        startDate: { gte: monthStart, lt: rangeEnd },
        weekType: { notIn: ['REGIONAL_ASSEMBLY', 'CIRCUIT_ASSEMBLY'] },
      },
      select: {
        id: true,
        weekNumber: true,
        year: true,
        startDate: true,
        endDate: true,
        biblicalReading: true,
        presidentId: true,
        openingPrayerId: true,
        sections: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            sectionType: true,
            order: true,
            items: {
              orderBy: { order: 'asc' },
              select: {
                id: true,
                title: true,
                itemType: true,
                order: true,
                timeMinutes: true,
                songNumber: true,
                requiresStudentHelper: true,
                assignments: { select: { role: true } },
              },
            },
          },
        },
      },
      orderBy: [{ year: 'asc' }, { weekNumber: 'asc' }],
    })

    return NextResponse.json(weeks)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al cargar pendientes' }, { status: 500 })
  }
}
