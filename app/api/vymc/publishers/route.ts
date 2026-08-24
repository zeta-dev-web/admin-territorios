import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { PUBLISHER_SELECT } from '@/lib/vymc/publisher-select'

export const dynamic = 'force-dynamic'

// GET /api/vymc/publishers - Directorio completo de la congregación
export async function GET() {
  try {
    const tenantId = await getCurrentTenantId()
    const publishers = await prisma.publisher.findMany({
      where: { tenantId },
      select: PUBLISHER_SELECT,
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    })
    return NextResponse.json(publishers)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener publicadores' }, { status: 500 })
  }
}

function validate(body: Record<string, unknown>) {
  const errors: string[] = []
  const firstName = String(body.firstName ?? '').trim()
  const lastName = String(body.lastName ?? '').trim()
  if (!firstName || firstName.length > 100) errors.push('Nombre requerido (máx. 100)')
  if (!lastName || lastName.length > 100) errors.push('Apellido requerido (máx. 100)')
  const phone = body.phone ? String(body.phone).trim() : null
  if (phone && phone.length > 30) errors.push('Teléfono demasiado largo')
  return {
    errors,
    data: {
      firstName, lastName, phone,
      gender: body.gender === 'FEMALE' ? ('FEMALE' as const) : ('MALE' as const),
      isBaptized: !!body.isBaptized,
      isElder: !!body.isElder,
      isMinisterialServant: !!body.isMinisterialServant,
      isPioneer: !!body.isPioneer,
      isConductor: !!body.isConductor,
      groupId: body.groupId ? String(body.groupId) : null,
    },
  }
}

// POST /api/vymc/publishers
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId()
    const body = await request.json()
    const { errors, data } = validate(body)
    if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 })

    if (data.groupId) {
      const group = await prisma.group.findFirst({ where: { id: data.groupId, tenantId } })
      if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 400 })
    }

    const publisher = await prisma.publisher.create({
      data: { ...data, tenantId },
      select: PUBLISHER_SELECT,
    })
    return NextResponse.json(publisher)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al crear el publicador' }, { status: 500 })
  }
}
