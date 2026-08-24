import { NextResponse } from 'next/server'
import { getCurrentTenantId } from '@/lib/tenant'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

function isAssignablePart(item: { songNumber: number | null; timeMinutes: number | null; title: string }) {
  const isPureSong = !!item.songNumber && !item.timeMinutes
  const t = item.title.toLowerCase()
  return !isPureSong && !t.includes('palabras de introducción') && !t.includes('palabras de conclusión')
}

const MONTHS = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

// GET /api/vymc/stats - métricas vivas del dashboard VYMC
export async function GET() {
  try {
    const tenantId = await getCurrentTenantId()
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [publishers, elders, ministerialServants, pioneers, totalWeeks] = await Promise.all([
      prisma.publisher.count({ where: { tenantId } }),
      prisma.publisher.count({ where: { tenantId, isElder: true } }),
      prisma.publisher.count({ where: { tenantId, isMinisterialServant: true } }),
      prisma.publisher.count({ where: { tenantId, isPioneer: true } }),
      prisma.week.count({ where: { tenantId } }),
    ])

    const monthWeeks = await prisma.week.findMany({
      where: { tenantId, startDate: { gte: monthStart, lt: nextMonthStart } },
      select: {
        id: true, presidentId: true, openingPrayerId: true,
        sections: { select: { items: { select: {
          title: true, songNumber: true, timeMinutes: true,
          _count: { select: { assignments: true } },
        } } } },
      },
    })

    let totalParts = 0, assignedParts = 0
    for (const w of monthWeeks) {
      totalParts += 2
      if (w.presidentId) assignedParts++
      if (w.openingPrayerId) assignedParts++
      for (const s of w.sections)
        for (const it of s.items) {
          if (!isAssignablePart(it)) continue
          totalParts++
          if (it._count.assignments > 0) assignedParts++
        }
    }

    const newAssignments = await prisma.meetingAssignment.count({
      where: { createdAt: { gte: monthStart, lt: nextMonthStart }, weekItem: { weekSection: { week: { tenantId } } } },
    })

    const upcoming = await prisma.week.findFirst({
      where: { tenantId, endDate: { gte: startOfToday } },
      orderBy: { startDate: 'asc' },
      select: {
        id: true, weekNumber: true, year: true, startDate: true, endDate: true,
        presidentId: true, openingPrayerId: true,
        sections: { select: { items: { select: { title: true, songNumber: true, timeMinutes: true, _count: { select: { assignments: true } } } } } },
      },
    })

    let nextMeeting = null
    if (upcoming) {
      let tp = 2, ap = 0
      if (upcoming.presidentId) ap++
      if (upcoming.openingPrayerId) ap++
      for (const s of upcoming.sections)
        for (const it of s.items) {
          if (!isAssignablePart(it)) continue
          tp++; if (it._count.assignments > 0) ap++
        }
      nextMeeting = {
        weekId: upcoming.id, weekNumber: upcoming.weekNumber, year: upcoming.year,
        startDate: upcoming.startDate.toISOString(), endDate: upcoming.endDate.toISOString(),
        totalParts: tp, assignedParts: ap,
        presidentAssigned: !!upcoming.presidentId, openingPrayerAssigned: !!upcoming.openingPrayerId,
      }
    }

    const [recentAssignments, recentImports] = await Promise.all([
      prisma.meetingAssignment.findMany({
        where: { weekItem: { weekSection: { week: { tenantId } } } },
        orderBy: { createdAt: 'desc' }, take: 5,
        include: { publisher: { select: { firstName: true, lastName: true } }, weekItem: { select: { title: true } } },
      }),
      prisma.week.findMany({
        where: { tenantId, scrapedAt: { not: null } },
        orderBy: { scrapedAt: 'desc' }, take: 3,
        select: { id: true, weekNumber: true, year: true, biblicalReading: true, scrapedAt: true },
      }),
    ])

    const ROLES: Record<string,string> = { ASSIGNEE:'Asignado', STUDENT:'Estudiante', HELPER:'Ayudante', CONDUCTOR:'Conductor', READER:'Lector' }
    const activity = [
      ...recentAssignments.map(a => ({
        id: `assignment-${a.id}`, kind: 'assignment' as const,
        description: `${a.publisher.firstName} ${a.publisher.lastName}`,
        detail: `${ROLES[a.role] ?? a.role} — ${a.weekItem.title}`,
        createdAt: a.createdAt.toISOString(), href: '/vymc/weeks',
      })),
      ...recentImports.map(w => ({
        id: `import-${w.id}`, kind: 'import' as const,
        description: `Programa importado — Semana ${w.weekNumber}/${w.year}`,
        detail: w.biblicalReading ?? undefined,
        createdAt: (w.scrapedAt ?? new Date()).toISOString(),
        href: `/vymc/weeks/${w.id}`,
      })),
    ].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0,6)

    return NextResponse.json({
      totals: { publishers, elders, ministerialServants, pioneers, weeks: totalWeeks },
      month: {
        year: now.getFullYear(), month: now.getMonth() + 1, label: MONTHS[now.getMonth()],
        totalParts, assignedParts,
        completionPercentage: totalParts > 0 ? Math.round((assignedParts / totalParts) * 100) : 0,
        newAssignments,
      },
      nextMeeting,
      recentActivity: activity,
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'No autenticado') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Error al obtener estadísticas' }, { status: 500 })
  }
}
