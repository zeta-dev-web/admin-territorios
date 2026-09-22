import { prisma } from "@/lib/prisma";

/**
 * Servicio de herramientas de solo lectura (Read-Only) para el Copiloto IA de Territorios.
 * Todas las consultas están estrictamente aisladas por tenantId (multinquilino).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type AiToolTerritoriosName =
  | "getTerritoryHistory"
  | "getPublisherTerritoryHistory"
  | "getTerritoryStatus"
  | "getAvailableTerritories"
  | "getTerritoriesStats"
  | "getUnassignedTerritories";

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// ============================================
// Tool 1: Historial completo de un territorio
// ============================================

export async function getTerritoryHistory(
  tenantId: string,
  args: { territoryNumber: number }
) {
  const territory = await prisma.territory.findFirst({
    where: {
      tenantId,
      number: args.territoryNumber,
    },
    include: {
      group: {
        select: { name: true },
      },
    },
  });

  if (!territory) {
    return {
      found: false,
      message: `No se encontró el territorio número ${args.territoryNumber}.`,
    };
  }

  const now = new Date();

  // Historial de asignaciones regulares (conductor)
  const assignments = await prisma.assignment.findMany({
    where: { territoryId: territory.id },
    orderBy: { startDate: "desc" },
    take: 10,
    include: {
      publisher: {
        select: { firstName: true, lastName: true },
      },
      blocks: {
        select: { letter: true },
      },
      dailyRecords: {
        select: { date: true, notes: true },
      },
    },
  });

  // Historial de asignaciones personales
  const personalAssignments = await prisma.personalAssignment.findMany({
    where: { territoryId: territory.id },
    orderBy: { assignedDate: "desc" },
    take: 10,
    include: {
      publisher: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  return {
    found: true,
    territory: {
      number: territory.number,
      description: territory.description,
      group: territory.group.name,
      regularAssignments: assignments.map((assignment) => ({
        publisher: assignment.publisher
          ? `${assignment.publisher.firstName} ${assignment.publisher.lastName}`
          : "Sin conductor asignado",
        startDate: assignment.startDate.toISOString(),
        endDate: assignment.endDate?.toISOString() ?? null,
        isCompleted: assignment.isCompleted,
        daysAssigned: assignment.endDate
          ? daysBetween(assignment.startDate, assignment.endDate)
          : daysBetween(assignment.startDate, now),
        blocksWorked: assignment.blocks.length,
        totalBlocks: assignment.blocks.map((block) => block.letter).sort(),
        dailyRecordsCount: assignment.dailyRecords.length,
      })),
      personalAssignments: personalAssignments.map((pa) => ({
        publisher: pa.publisher
          ? `${pa.publisher.firstName} ${pa.publisher.lastName}`
          : "Sin publicador",
        assignedDate: pa.assignedDate.toISOString(),
        returnedDate: pa.returnedDate?.toISOString() ?? null,
        isActive: pa.isActive,
        daysAssigned: pa.returnedDate
          ? daysBetween(pa.assignedDate, pa.returnedDate)
          : daysBetween(pa.assignedDate, now),
        notes: pa.notes,
      })),
    },
  };
}

// ============================================
// Tool 2: Historial de territorios de un publicador
// ============================================

export async function getPublisherTerritoryHistory(
  tenantId: string,
  args: { publisherName: string }
) {
  const searchTerm = args.publisherName.trim();
  const words = searchTerm.split(/\s+/).filter(Boolean);

  const matchedPublishers = await prisma.publisher.findMany({
    where: {
      tenantId,
      OR: words.flatMap((word) => [
        { firstName: { contains: word, mode: "insensitive" as const } },
        { lastName: { contains: word, mode: "insensitive" as const } },
      ]),
    },
    take: 3,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });

  if (matchedPublishers.length === 0) {
    return {
      found: false,
      message: `No se encontró ningún publicador con el nombre "${searchTerm}".`,
    };
  }

  const now = new Date();

  const publishersWithHistory = await Promise.all(
    matchedPublishers.map(async (publisher) => {
      // Asignaciones regulares como conductor
      const regularAssignments = await prisma.assignment.findMany({
        where: { publisherId: publisher.id },
        orderBy: { startDate: "desc" },
        take: 10,
        include: {
          territory: {
            select: { number: true, description: true },
          },
          blocks: true,
          dailyRecords: true,
        },
      });

      // Asignaciones personales
      const personalAssignments = await prisma.personalAssignment.findMany({
        where: { publisherId: publisher.id },
        orderBy: { assignedDate: "desc" },
        take: 10,
        include: {
          territory: {
            select: { number: true, description: true },
          },
        },
      });

      // Registros diarios (para asignaciones donde trabajó pero no es conductor)
      const dailyRecords = await prisma.dailyRecord.findMany({
        where: { publisherId: publisher.id },
        orderBy: { date: "desc" },
        take: 10,
        include: {
          assignment: {
            include: {
              territory: {
                select: { number: true, description: true },
              },
            },
          },
          block: {
            select: { letter: true },
          },
        },
      });

      return {
        fullName: `${publisher.firstName} ${publisher.lastName}`,
        regularAssignments: regularAssignments.map((assignment) => ({
          territoryNumber: assignment.territory.number,
          territoryDescription: assignment.territory.description,
          startDate: assignment.startDate.toISOString(),
          endDate: assignment.endDate?.toISOString() ?? null,
          isCompleted: assignment.isCompleted,
          daysAssigned: assignment.endDate
            ? daysBetween(assignment.startDate, assignment.endDate)
            : daysBetween(assignment.startDate, now),
          blocksWorked: assignment.blocks.length,
          dailyRecordsCount: assignment.dailyRecords.length,
        })),
        personalAssignments: personalAssignments.map((pa) => ({
          territoryNumber: pa.territory.number,
          territoryDescription: pa.territory.description,
          assignedDate: pa.assignedDate.toISOString(),
          returnedDate: pa.returnedDate?.toISOString() ?? null,
          isActive: pa.isActive,
          daysAssigned: pa.returnedDate
            ? daysBetween(pa.assignedDate, pa.returnedDate)
            : daysBetween(pa.assignedDate, now),
          notes: pa.notes,
        })),
        dailyRecords: dailyRecords.map((record) => ({
          territoryNumber: record.assignment.territory.number,
          block: record.block.letter,
          date: record.date.toISOString(),
          notes: record.notes,
          daysAgo: daysBetween(new Date(record.date), now),
        })),
      };
    })
  );

  return { found: true, publishers: publishersWithHistory };
}

// ============================================
// Tool 3: Estado actual de un territorio
// ============================================

export async function getTerritoryStatus(
  tenantId: string,
  args: { territoryNumber: number }
) {
  const territory = await prisma.territory.findFirst({
    where: {
      tenantId,
      number: args.territoryNumber,
    },
    include: {
      group: {
        select: { name: true },
      },
      blocks: {
        select: { letter: true, assignmentId: true },
      },
    },
  });

  if (!territory) {
    return {
      found: false,
      message: `No se encontró el territorio número ${args.territoryNumber}.`,
    };
  }

  // Asignación activa (conductor actual)
  const currentAssignment = await prisma.assignment.findFirst({
    where: {
      territoryId: territory.id,
      isCompleted: false,
    },
    orderBy: { startDate: "desc" },
    include: {
      publisher: {
        select: { firstName: true, lastName: true },
      },
      blocks: {
        select: { letter: true },
      },
      dailyRecords: {
        orderBy: { date: "desc" },
        take: 5,
        select: {
          date: true,
          block: { select: { letter: true } },
          notes: true,
        },
      },
    },
  });

  // Asignaciones personales activas
  const activePersonalAssignments = await prisma.personalAssignment.findMany({
    where: {
      territoryId: territory.id,
      isActive: true,
    },
    include: {
      publisher: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  const now = new Date();

  return {
    found: true,
    territory: {
      number: territory.number,
      description: territory.description,
      group: territory.group.name,
      totalBlocks: territory.blocks.length,
      currentAssignment: currentAssignment
        ? {
            conductor: `${currentAssignment.publisher?.firstName ?? ""} ${currentAssignment.publisher?.lastName ?? ""}`.trim() || "Sin conductor",
            startDate: currentAssignment.startDate.toISOString(),
            daysActive: daysBetween(currentAssignment.startDate, now),
            blocksAssigned: currentAssignment.blocks.map((b) => b.letter).sort(),
            lastDailyRecords: currentAssignment.dailyRecords.map((record) => ({
              date: record.date.toISOString(),
              block: record.block.letter,
              notes: record.notes,
              daysAgo: daysBetween(new Date(record.date), now),
            })),
          }
        : null,
      activePersonalAssignments: activePersonalAssignments.map((pa) => ({
        publisher: `${pa.publisher?.firstName ?? ""} ${pa.publisher?.lastName ?? ""}`.trim() || "Sin publicador",
        assignedDate: pa.assignedDate.toISOString(),
        daysActive: daysBetween(pa.assignedDate, now),
        notes: pa.notes,
      })),
    },
  };
}

// ============================================
// Tool 4: Territorios disponibles
// ============================================

export async function getAvailableTerritories(
  tenantId: string,
  args: { groupName?: string; includePersonalAssignments?: boolean }
) {
  let groupFilter = {};
  if (args.groupName) {
    const group = await prisma.group.findFirst({
      where: {
        tenantId,
        name: { contains: args.groupName, mode: "insensitive" },
      },
    });
    if (group) {
      groupFilter = { groupId: group.id };
    }
  }

  const territories = await prisma.territory.findMany({
    where: {
      tenantId,
      ...groupFilter,
    },
    include: {
      group: {
        select: { name: true },
      },
      assignments: {
        where: { isCompleted: false },
        orderBy: { startDate: "desc" },
        take: 1,
      },
      personalAssignments: {
        where: { isActive: true },
        include: {
          publisher: {
            select: { firstName: true, lastName: true },
          },
        },
      },
    },
    orderBy: { number: "asc" },
  });

  const now = new Date();

  const availableForRegular = territories
    .filter((t) => t.assignments.length === 0)
    .map((t) => ({
      number: t.number,
      description: t.description,
      group: t.group.name,
      hasActivePersonalAssignments: t.personalAssignments.length > 0,
      personalAssignments: args.includePersonalAssignments
        ? t.personalAssignments.map((pa) => ({
            publisher: `${pa.publisher?.firstName ?? ""} ${pa.publisher?.lastName ?? ""}`.trim(),
            daysActive: daysBetween(pa.assignedDate, now),
          }))
        : undefined,
    }));

  const assigned = territories
    .filter((t) => t.assignments.length > 0)
    .map((t) => {
      const assignment = t.assignments[0];
      return {
        number: t.number,
        description: t.description,
        group: t.group.name,
        daysAssigned: daysBetween(assignment.startDate, now),
      };
    });

  return {
    filters: args,
    totalTerritories: territories.length,
    availableForRegularAssignment: availableForRegular.length,
    assigned: assigned.length,
    territories: {
      available: availableForRegular,
      assigned,
    },
  };
}

// ============================================
// Tool 5: Estadísticas de territorios
// ============================================

export async function getTerritoriesStats(tenantId: string) {
  const [
    totalTerritories,
    totalBlocks,
    activeAssignments,
    completedAssignments,
    activePersonalAssignments,
    totalGroups,
  ] = await Promise.all([
    prisma.territory.count({ where: { tenantId } }),
    prisma.block.count({ where: { tenantId } }),
    prisma.assignment.count({ where: { tenantId, isCompleted: false } }),
    prisma.assignment.count({ where: { tenantId, isCompleted: true } }),
    prisma.personalAssignment.count({ where: { tenantId, isActive: true } }),
    prisma.group.count({ where: { tenantId } }),
  ]);

  // Territorios disponibles (sin asignación activa)
  const available = totalTerritories - activeAssignments;

  // Últimas asignaciones completadas
  const recentCompletions = await prisma.assignment.findMany({
    where: {
      tenantId,
      isCompleted: true,
      endDate: { not: null },
    },
    orderBy: { endDate: "desc" },
    take: 5,
    include: {
      territory: {
        select: { number: true, description: true },
      },
      publisher: {
        select: { firstName: true, lastName: true },
      },
    },
  });

  const now = new Date();

  // Conductores más activos (por número de asignaciones completadas)
  const topConductors = await prisma.assignment.groupBy({
    by: ["publisherId"],
    where: {
      tenantId,
      isCompleted: true,
      publisherId: { not: null },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 5,
  });

  const conductorsWithNames = await Promise.all(
    topConductors.map(async (conductor) => {
      if (!conductor.publisherId) return null;
      const publisher = await prisma.publisher.findUnique({
        where: { id: conductor.publisherId },
        select: { firstName: true, lastName: true },
      });
      return {
        name: publisher
          ? `${publisher.firstName} ${publisher.lastName}`
          : "Desconocido",
        completedAssignments: conductor._count.id,
      };
    })
  );

  return {
    tenantId,
    stats: {
      totalTerritories,
      totalBlocks,
      totalGroups,
      activeRegularAssignments: activeAssignments,
      activePersonalAssignments,
      availableTerritories: available,
      completedAssignments,
      coveragePercent: totalTerritories > 0
        ? Math.round((activeAssignments / totalTerritories) * 100)
        : null,
    },
    recentCompletions: recentCompletions.map((assignment) => ({
      territoryNumber: assignment.territory.number,
      territoryDescription: assignment.territory.description,
      conductor: assignment.publisher
        ? `${assignment.publisher.firstName} ${assignment.publisher.lastName}`
        : "Sin conductor",
      startDate: assignment.startDate.toISOString(),
      endDate: assignment.endDate?.toISOString() ?? null,
      duration: assignment.endDate
        ? daysBetween(assignment.startDate, assignment.endDate)
        : null,
      daysAgo: assignment.endDate ? daysBetween(assignment.endDate, now) : null,
    })),
    topConductors: conductorsWithNames.filter((c) => c !== null),
  };
}

// ============================================
// Tool 6: Territorios no asignados en un periodo
// ============================================

const MAX_UNASSIGNED_RESULTS = 200;

function parseAiDate(value: string | undefined, endOfDay: boolean): Date | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const raw = value.trim();
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Fecha inválida: "${value}". Usá formato YYYY-MM-DD.`);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [y, m, day] = raw.split("-").map(Number);
    d.setFullYear(y, m - 1, day);
  }
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

export async function getUnassignedTerritories(
  tenantId: string,
  args: { desde?: string; hasta?: string }
) {
  const desde = parseAiDate(args.desde, false);
  const hasta = parseAiDate(args.hasta, true);

  if (desde && hasta && desde > hasta) {
    return {
      found: false,
      message: 'El parámetro "desde" no puede ser posterior a "hasta".',
    };
  }

  const hasPeriod = Boolean(desde || hasta);
  const rangeFilter =
    desde && hasta
      ? { gte: desde, lte: hasta }
      : desde
        ? { gte: desde }
        : hasta
          ? { lte: hasta }
          : undefined;

  const territories = await prisma.territory.findMany({
    where: {
      tenantId,
      AND: [
        rangeFilter
          ? { assignments: { none: { startDate: rangeFilter } } }
          : { assignments: { none: {} } },
        rangeFilter
          ? { personalAssignments: { none: { assignedDate: rangeFilter } } }
          : { personalAssignments: { none: {} } },
      ],
    },
    include: {
      group: { select: { name: true } },
    },
    orderBy: { number: "asc" },
    take: MAX_UNASSIGNED_RESULTS + 1,
  });

  const truncated = territories.length > MAX_UNASSIGNED_RESULTS;
  const shown = truncated ? territories.slice(0, MAX_UNASSIGNED_RESULTS) : territories;

  return {
    found: true,
    mode: hasPeriod ? "not-assigned-in-period" : "never-assigned",
    desde: desde?.toISOString() ?? null,
    hasta: hasta?.toISOString() ?? null,
    total: truncated ? `más de ${MAX_UNASSIGNED_RESULTS}` : territories.length,
    truncated,
    territories: shown.map((t) => ({
      number: t.number,
      description: t.description,
      group: t.group.name,
    })),
  };
}
