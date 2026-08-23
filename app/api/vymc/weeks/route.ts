import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function isNoAuth(e: unknown) {
  return e instanceof Error && e.message === 'No autenticado'
}

// GET /api/vymc/weeks?includeDetails=true&year=YYYY
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId()
    const sp = new URL(request.url).searchParams
    const includeDetails = sp.get('includeDetails') === 'true'
    const year = sp.get('year')

    if (includeDetails || true) {
      const weeks = await prisma.week.findMany({
        where: { tenantId, ...(year ? { year: parseInt(year) } : {}) },
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
        orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
      })
      return NextResponse.json(weeks)
    }
  } catch (error) {
    if (isNoAuth(error)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    console.error('Error listing weeks:', error)
    return NextResponse.json({ error: 'Error al obtener semanas' }, { status: 500 })
  }
}

// POST /api/vymc/weeks
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId()
    const b = await request.json()

    const errors: string[] = []
    if (!Number.isInteger(b.weekNumber)) errors.push('weekNumber inválido')
    if (!Number.isInteger(b.year)) errors.push('year inválido')
    if (!b.startDate || !b.endDate) errors.push('fechas requeridas')
    if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 })

    const exists = await prisma.week.findUnique({
      where: { tenantId_weekNumber_year: { tenantId, weekNumber: b.weekNumber, year: b.year } },
    })
    if (exists) {
      return NextResponse.json(
        { error: `Ya existe una semana ${b.weekNumber} del año ${b.year}` },
        { status: 400 }
      )
    }

    const week = await prisma.week.create({
      data: {
        weekNumber: b.weekNumber,
        year: b.year,
        startDate: new Date(b.startDate),
        endDate: new Date(b.endDate),
        biblicalReading: b.biblicalReading ?? null,
        tenantId,
      },
      include: { sections: { include: { items: true }, orderBy: { order: 'asc' } } },
    })
    return NextResponse.json(week)
  } catch (error) {
    if (isNoAuth(error)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    console.error('Error creating week:', error)
    return NextResponse.json({ error: 'Error al crear semana' }, { status: 500 })
  }
}
