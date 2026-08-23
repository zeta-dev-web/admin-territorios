import { NextRequest, NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'
import type { AssignmentRole } from '@prisma/client'
import { canAssignPublisher } from '@/lib/assignment-eligibility'
import { buildAutoAssignPlan, type AutoAssignCandidate } from '@/lib/auto-assign'

export const dynamic = 'force-dynamic'

// POST /api/vymc/weeks/[id]/auto-assign
// { preview:true } → borrador | { assignments:[...] } → aplica selección | {} → todo
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const tenantId = await getCurrentTenantId()
    const { id } = await ctx.params

    let body: { preview?: boolean; assignments?: Array<Record<string, unknown>> } = {}
    try { body = await request.json() } catch { /* legacy: aplicar todo */ }

    const week = await prisma.week.findFirst({
      where: { id, tenantId },
      include: {
        sections: {
          orderBy: { order: 'asc' },
          include: {
            items: {
              orderBy: { order: 'asc' },
              include: { assignments: { include: { publisher: { select: { gender: true } } } } },
            },
          },
        },
      },
    })
    if (!week) return NextResponse.json({ error: 'Programa no encontrado' }, { status: 404 })

    const publishers = await prisma.publisher.findMany({
      where: { tenantId },
      orderBy: [{ lastAssignedAt: 'asc' }, { lastName: 'asc' }, { firstName: 'asc' }],
    })

    // ---- PREVIEW ----
    if (body.preview) {
      const plan = buildAutoAssignPlan(week, publishers as AutoAssignCandidate[])
      return NextResponse.json(plan)
    }

    const result = await prisma.$transaction(async (tx) => {
      let assigned = 0
      const skipped: string[] = []
      const affected = new Set<string>()

      if (Array.isArray(body.assignments)) {
        // Aplicación selectiva con revalidación
        const fresh = await tx.week.findFirst({
          where: { id, tenantId },
          include: { sections: { include: { items: { include: { assignments: true } } } } },
        })
        if (!fresh) throw new Error('Programa no encontrado')

        const itemsById = new Map<string, { title: string; itemType: string; sectionType: string; taken: Set<string> }>()
        for (const sec of fresh.sections)
          for (const it of sec.items)
            itemsById.set(it.id, { title: it.title, itemType: it.itemType, sectionType: sec.sectionType, taken: new Set(it.assignments.map((x) => x.role)) })

        for (const p of body.assignments as Array<{ kind?: string; field?: string; weekItemId?: string; role?: string; publisherId?: string }>) {
          if (p.kind === 'special') {
            const field = p.field as 'presidentId' | 'openingPrayerId'
            if (fresh[field]) continue
            const pub = publishers.find((x) => x.id === p.publisherId)
            const ok = pub && canAssignPublisher(pub, { sectionType: field === 'presidentId' ? 'PRESIDENT' : 'OPENING_PRAYER' })
            if (!ok) { skipped.push(field === 'presidentId' ? 'Presidencia' : 'Oración de apertura'); continue }
            await tx.week.update({ where: { id }, data: { [field]: p.publisherId } })
            affected.add(p.publisherId!)
            assigned++
            continue
          }
          const item = itemsById.get(p.weekItemId ?? '')
          const pub = publishers.find((x) => x.id === p.publisherId)
          if (!item || !pub || item.taken.has(p.role ?? '')) continue
          if (!canAssignPublisher(pub, { sectionType: item.sectionType, itemType: item.itemType, role: p.role })) {
            skipped.push(`${item.title} (${p.role})`)
            continue
          }
          await tx.meetingAssignment.create({
            data: { weekItemId: p.weekItemId!, publisherId: pub.id, role: p.role as AssignmentRole },
          })
          item.taken.add(p.role!)
          affected.add(pub.id)
          assigned++
        }
      } else {
        // Legacy: planificar y aplicar todo
        const plan = buildAutoAssignPlan(
          { ...week, sections: week.sections.map((s) => ({ ...s })) },
          publishers as AutoAssignCandidate[]
        )
        skipped.push(...plan.skipped)
        for (const pr of plan.proposals) {
          if (pr.kind === 'special') {
            await tx.week.update({ where: { id }, data: { [pr.field]: pr.publisherId } })
          } else {
            await tx.meetingAssignment.create({
              data: { weekItemId: pr.weekItemId, publisherId: pr.publisherId, role: pr.role },
            })
          }
          affected.add(pr.publisherId)
          assigned++
        }
      }

      for (const publisherId of affected) {
        await tx.publisher.update({
          where: { id: publisherId },
          data: { lastAssignedAt: week.startDate },
        })
      }
      return { assigned, skipped }
    })

    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    if (error instanceof Error && error.message === 'Programa no encontrado') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    console.error('Error en auto-assign:', error)
    return NextResponse.json({ error: 'No se pudieron completar las asignaciones' }, { status: 500 })
  }
}
