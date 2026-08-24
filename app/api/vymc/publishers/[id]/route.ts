import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import { PUBLISHER_SELECT } from '@/lib/vymc/publisher-select'

export const dynamic = 'force-dynamic'

// PUT /api/vymc/publishers/[id]
export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t0 = Date.now()
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.firstName !== undefined) data.firstName = String(body.firstName).trim()
    if (body.lastName !== undefined) data.lastName = String(body.lastName).trim()
    if (body.phone !== undefined) data.phone = body.phone ? String(body.phone).trim() : null
    if (body.gender !== undefined) data.gender = body.gender === 'FEMALE' ? 'FEMALE' : 'MALE'
    for (const k of ['isBaptized', 'isElder', 'isMinisterialServant', 'isPioneer', 'isConductor'] as const) {
      if (body[k] !== undefined) data[k] = !!body[k]
    }
    if (body.groupId !== undefined) {
      if (body.groupId === null || body.groupId === '') {
        data.groupId = null
      } else {
        const group = await prisma.group.findFirst({
          where: { id: String(body.groupId), tenantId },
          select: { id: true },
        })
        if (!group) return NextResponse.json({ error: 'Grupo no encontrado' }, { status: 400 })
        data.groupId = String(body.groupId)
      }
    }

    // Una sola escritura scopeada al tenant (sin query previa)
    const updated = await prisma.publisher.updateMany({
      where: { id, tenantId },
      data,
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Publicador no encontrado' }, { status: 404 })
    }

    const publisher = await prisma.publisher.findFirst({
      where: { id, tenantId },
      select: PUBLISHER_SELECT,
    })

    console.log(`⏱️ PUT publisher ${Date.now() - t0}ms`)
    return NextResponse.json(publisher)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error('❌ PUT publisher falló en', Date.now() - t0, 'ms:', error)
    return NextResponse.json({ error: 'Error al actualizar el publicador' }, { status: 500 })
  }
}

// DELETE /api/vymc/publishers/[id]
export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params

    const deleted = await prisma.publisher.deleteMany({ where: { id, tenantId } })
    if (deleted.count === 0) {
      return NextResponse.json({ error: 'Publicador no encontrado' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2003') {
      return NextResponse.json(
        { error: 'No se puede eliminar: el publicador tiene asignaciones registradas' },
        { status: 400 }
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al eliminar el publicador' }, { status: 500 })
  }
}
