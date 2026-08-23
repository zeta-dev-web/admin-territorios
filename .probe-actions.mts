import { prisma } from './lib/prisma'

const tenantId = 'cmqn5mwei0000p0lo3iqi9gow'

try {
  const drivers = await prisma.publisher.findMany({
    where: { tenantId, isConductor: true },
    include: { group: true,
      assignments: { select: { id: true, isCompleted: true, territory: { select: { number: true } } } },
      _count: { select: { assignments: true, dailyRecords: true } },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
  })
  console.log('getAllDrivers OK:', drivers.length, '→', drivers.map(d => `${d.firstName} ${d.lastName}`).slice(0,5))
} catch (e:any) { console.error('❌ getAllDrivers falla:', e.message) }

try {
  const groups = await prisma.group.findMany({
    where: { tenantId },
    include: { publishers: { include: {
      _count: { select: { assignments: true } },
      personalAssignments: { where: { isActive: true }, include: { territory: true } },
    }, orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }] } },
    orderBy: { name: 'asc' },
  })
  console.log('getAllGroups OK:', groups.length, '→', groups.map(g => `${g.name}(${g.publishers.length})`))
} catch (e:any) { console.error('❌ getAllGroups falla:', e.message) }

await prisma.$disconnect()
