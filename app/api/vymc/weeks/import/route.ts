import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// POST /api/vymc/weeks/import - Guarda el programa scrapeado como semana completa
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId()
    const b = await request.json()

    if (!Number.isInteger(b.weekNumber) || !Number.isInteger(b.year) || !b.startDate || !Array.isArray(b.sections)) {
      return NextResponse.json({ error: 'Payload incompleto' }, { status: 400 })
    }

    const exists = await prisma.week.findUnique({
      where: { tenantId_weekNumber_year: { tenantId, weekNumber: b.weekNumber, year: b.year } },
    })
    if (exists) {
      return NextResponse.json(
        { error: `Ya existe una semana ${b.weekNumber} del año ${b.year}` },
        { status: 400 }
      )
    }

    const total = b.sections.length
    const week = await prisma.week.create({
      data: {
        weekNumber: b.weekNumber,
        year: b.year,
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        biblicalReading: b.biblicalReading ?? null,
        scrapedAt: new Date(),
        tenantId,
        sections: {
          create: [
            {
              sectionType: 'PRESIDENT', order: 0,
              items: { create: [{ title: 'Presidente', itemType: 'CONDUCTOR_READER', order: 1 }] },
            },
            ...b.sections.map((sec: { sectionType: string; items?: unknown[] }, idx: number) => ({
              sectionType: sec.sectionType,
              order: idx + 2,
              items: {
                create: (sec.items ?? []) as Array<Record<string, unknown>>,
              },
            })),
            {
              sectionType: 'CLOSING_PRAYER', order: total + 2,
              items: { create: [{ title: 'Oración final', itemType: 'PRAYER', order: 1 }] },
            },
          ],
        },
      },
      include: { sections: { include: { items: true }, orderBy: { order: 'asc' } } },
    })

    return NextResponse.json(week)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('Error importing week:', error)
    return NextResponse.json({ error: 'Error al importar la semana' }, { status: 500 })
  }
}
