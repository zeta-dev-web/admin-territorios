import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/vymc/groups - lista simple para selects y filtros
export async function GET() {
  try {
    const tenantId = await getCurrentTenantId()
    const groups = await prisma.group.findMany({
      where: { tenantId },
      select: { id: true, name: true, _count: { select: { publishers: true } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(groups)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener grupos' }, { status: 500 })
  }
}

// POST /api/vymc/groups - crea un grupo con solo el nombre
export async function POST(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId()
    const { name } = await request.json()

    const clean = String(name ?? '').trim()
    if (!clean) return NextResponse.json({ error: 'El nombre del grupo es requerido' }, { status: 400 })
    if (clean.length > 80) return NextResponse.json({ error: 'Nombre demasiado largo (máx. 80)' }, { status: 400 })

    const duplicate = await prisma.group.findFirst({ where: { tenantId, name: clean } })
    if (duplicate) {
      return NextResponse.json({ error: `Ya existe un grupo "${clean}"` }, { status: 400 })
    }

    const group = await prisma.group.create({
      data: { name: clean, tenantId },
      select: { id: true, name: true },
    })
    return NextResponse.json(group)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al crear el grupo' }, { status: 500 })
  }
}
