import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { canAssignPublisher } from '@/lib/assignment-eligibility'

export const dynamic = 'force-dynamic'

// POST /api/vymc/assignments - Crea una asignación de reunión
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId()
    const b = await request.json()

    if (!b.weekItemId || !b.publisherId || !b.role) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const item = await prisma.weekItem.findFirst({
      where: { id: b.weekItemId },
      include: {
        weekSection: { select: { sectionType: true, week: { select: { id: true, startDate: true, tenantId: true } } } },
        assignments: true,
      },
    })
    if (!item || item.weekSection.week.tenantId !== tenantId) {
      return NextResponse.json({ error: 'Parte no encontrada' }, { status: 404 })
    }
    if (item.assignments.some((a) => a.role === b.role)) {
      return NextResponse.json({ error: 'Ese rol ya está asignado en esta parte' }, { status: 400 })
    }

    const publisher = await prisma.publisher.findFirst({ where: { id: b.publisherId, tenantId } })
    if (!publisher) return NextResponse.json({ error: 'Publicador no encontrado' }, { status: 404 })

    const eligible = canAssignPublisher(publisher, {
      sectionType: item.weekSection.sectionType,
      itemType: item.itemType,
      role: b.role,
    })
    if (!eligible) {
      return NextResponse.json(
        { error: 'Este publicador no cumple los requisitos para esta parte' },
        { status: 400 }
      )
    }

    const created = await prisma.meetingAssignment.create({
      data: { weekItemId: item.id, publisherId: publisher.id, role: b.role },
      include: { publisher: true },
    })

    // Rotación: registrar participación con la fecha de la reunión
    await prisma.publisher.update({
      where: { id: publisher.id },
      data: { lastAssignedAt: item.weekSection.week.startDate },
    })

    return NextResponse.json(created)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al crear asignación' }, { status: 500 })
  }
}
