import { prisma } from "@/lib/prisma";
import {
  canAssignPublisher,
} from "@/lib/assignment-eligibility";

/**
 * Servicio de herramientas de solo lectura (Read-Only) para el Copiloto IA.
 * Todas las consultas están estrictamente aisladas por tenantId (multinquilino).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type AiToolName =
  | "getPublisherHistory"
  | "getLeastAssignedPublishers"
  | "getWeekProgramDetails"
  | "getCongregationStats";

export function getAppointmentLabel(publisher: {
  isElder: boolean | null;
  isMinisterialServant: boolean | null;
  isPioneer: boolean | null;
  isBaptized: boolean | null;
}): string {
  if (publisher.isElder) return "Anciano";
  if (publisher.isMinisterialServant) return "Siervo Ministerial";
  if (publisher.isBaptized === false) return "No bautizado";
  return publisher.isPioneer ? "Precursor" : "Publicador";
}

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

// ============================================
// Tool 1: Historial de un publicador
// ============================================

export async function getPublisherHistory(
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
    return { found: false, message: `No se encontró ningún publicador con el nombre "${searchTerm}".` };
  }

  const now = new Date();

  const publishersWithHistory = await Promise.all(
    matchedPublishers.map(async (publisher) => {
      const [assignments, specialWeeks] = await Promise.all([
        prisma.meetingAssignment.findMany({
          where: { publisherId: publisher.id },
          orderBy: {
            weekItem: {
              weekSection: {
                week: { startDate: "desc" },
              },
            },
          },
          take: 5,
          select: {
            role: true,
            weekItem: {
              select: {
                title: true,
                timeMinutes: true,
                weekSection: {
                  select: {
                    sectionType: true,
                    week: {
                      select: { startDate: true, weekNumber: true, year: true },
                    },
                  },
                },
              },
            },
          },
        }),
        prisma.week.findMany({
          where: {
            tenantId,
            OR: [{ presidentId: publisher.id }, { openingPrayerId: publisher.id }],
          },
          orderBy: { startDate: "desc" },
          take: 5,
          select: {
            startDate: true,
            weekNumber: true,
            year: true,
            presidentId: true,
            openingPrayerId: true,
          },
        }),
      ]);

      const historyItems = [
        ...assignments.map((assignment) => ({
          date: assignment.weekItem.weekSection.week.startDate,
          role: assignment.role,
          partTitle: assignment.weekItem.title,
          sectionType: assignment.weekItem.weekSection.sectionType,
        })),
        ...specialWeeks.map((week) => ({
          date: week.startDate,
          role: week.presidentId === publisher.id ? "PRESIDENT" : "OPENING_PRAYER",
          partTitle:
            week.presidentId === publisher.id
              ? "Presidencia de la reunión"
              : "Oración de apertura",
          sectionType:
            week.presidentId === publisher.id ? "PRESIDENT" : "OPENING_PRAYER",
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5)
        .map((item) => ({
          ...item,
          date: item.date.toISOString(),
          daysAgo: daysBetween(new Date(item.date), now),
        }));

      return {
        fullName: `${publisher.firstName} ${publisher.lastName}`,
        appointment: getAppointmentLabel(publisher),
        gender: publisher.gender,
        lastAssignedAt: publisher.lastAssignedAt?.toISOString() ?? null,
        recentAssignments: historyItems,
      };
    })
  );

  return { found: true, publishers: publishersWithHistory };
}

// ============================================
// Tool 2: Publicadores con más tiempo sin asignar
// ============================================

export async function getLeastAssignedPublishers(
  tenantId: string,
  args: {
    sectionType?: string;
    itemType?: string;
    role?: string;
    limit?: number;
  }
) {
  const limit = Math.min(Math.max(args.limit ?? 5, 1), 15);

  const publishers = await prisma.publisher.findMany({
    where: { tenantId: tenantId },
  });

  let eligible = publishers;

  // Si se indican filtros de sección/rol, aplicar las reglas teocráticas
  if (args.sectionType || args.itemType || args.role) {
    eligible = publishers.filter((publisher) =>
      canAssignPublisher(publisher, {
        sectionType: args.sectionType ?? "",
        itemType: args.itemType,
        role: args.role,
      })
    );
  }

  const now = new Date();

  const sorted = [...eligible]
    .sort((a, b) => {
      if (a.lastAssignedAt === null && b.lastAssignedAt !== null) return -1;
      if (a.lastAssignedAt !== null && b.lastAssignedAt === null) return 1;
      if (a.lastAssignedAt && b.lastAssignedAt) {
        return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
      }
      return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
    })
    .slice(0, limit)
    .map((publisher) => ({
      id: publisher.id,
      fullName: `${publisher.firstName} ${publisher.lastName}`,
      appointment: getAppointmentLabel(publisher),
      gender: publisher.gender,
      lastAssignedAt: publisher.lastAssignedAt?.toISOString() ?? null,
      weeksSinceLastAssignment:
        publisher.lastAssignedAt === null
          ? null
          : Math.floor(daysBetween(publisher.lastAssignedAt, now) / 7),
    }));

  return {
    filters: args,
    totalEligible: eligible.length,
    publishers: sorted,
  };
}

// ============================================
// Tool 3: Estado del programa de una semana
// ============================================

function getExpectedRolesForItem(item: {
  itemType: string;
  title: string;
  requiresStudentHelper: boolean;
}): string[] {
  if (item.itemType === "PRAYER") return ["ASSIGNEE"];
  if (item.title.toLowerCase().includes("estudio bíblico") ||
      item.title.toLowerCase().includes("estudio biblico")) {
    return ["CONDUCTOR", "READER"];
  }
  if (item.requiresStudentHelper) return ["ASSIGNEE", "HELPER"];
  return ["ASSIGNEE"];
}

export async function getWeekProgramDetails(
  tenantId: string,
  args: { weekNumber?: number; year?: number }
) {
  let week = null;

  if (args.weekNumber && args.year) {
    week = await prisma.week.findUnique({
      where: {
        tenantId_weekNumber_year: {
          tenantId,
          weekNumber: args.weekNumber,
          year: args.year,
        },
      },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            items: {
              orderBy: { order: "asc" },
              include: {
                assignments: {
                  include: {
                    publisher: {
                      select: { firstName: true, lastName: true, gender: true },
                    },
                  },
                },
              },
            },
          },
        },
        president: { select: { firstName: true, lastName: true } },
        openingPrayer: { select: { firstName: true, lastName: true } },
      },
    });
  } else {
    // Semana actual (fecha de hoy dentro del rango)
    week = await prisma.week.findFirst({
      where: {
        tenantId,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
      include: {
        sections: {
          orderBy: { order: "asc" },
          include: {
            items: {
              orderBy: { order: "asc" },
              include: {
                assignments: {
                  include: {
                    publisher: {
                      select: { firstName: true, lastName: true, gender: true },
                    },
                  },
                },
              },
            },
          },
        },
        president: { select: { firstName: true, lastName: true } },
        openingPrayer: { select: { firstName: true, lastName: true } },
      },
    });

    if (!week) {
      // Si no hay semana en curso, traer la más próxima futura
      week = await prisma.week.findFirst({
        where: { tenantId: tenantId, startDate: { gt: new Date() } },
        orderBy: { startDate: "asc" },
        include: {
          sections: {
            orderBy: { order: "asc" },
            include: {
              items: {
                orderBy: { order: "asc" },
                include: {
                  assignments: {
                    include: {
                      publisher: {
                        select: { firstName: true, lastName: true, gender: true },
                      },
                    },
                  },
                },
              },
            },
          },
          president: { select: { firstName: true, lastName: true } },
          openingPrayer: { select: { firstName: true, lastName: true } },
        },
      });
    }
  }

  if (!week) {
    return { found: false, message: "No se encontró ninguna semana para los datos indicados." };
  }

  const pendingSlots: string[] = [];

  if (!week.president) pendingSlots.push("Presidencia");
  if (!week.openingPrayer) pendingSlots.push("Oración inicial");

  const sectionsSummary = week.sections.map((section) => ({
    sectionType: section.sectionType,
    items: section.items
      .filter(
        (item) =>
          !item.title.toLowerCase().includes("palabras de introducción") &&
          !(item.songNumber && !item.timeMinutes && item.assignments.length === 0)
      )
      .map((item) => {
        const expectedRoles = getExpectedRolesForItem(item);
        const filled = expectedRoles.filter((role) =>
          item.assignments.some((assignment) => assignment.role === role)
        );
        for (const role of expectedRoles) {
          if (!filled.includes(role)) {
            pendingSlots.push(`${item.title} (${role})`);
          }
        }
        return {
          title: item.title,
          assignments: item.assignments.map((assignment) => ({
            role: assignment.role,
            publisher: `${assignment.publisher.firstName} ${assignment.publisher.lastName}`,
          })),
          complete: filled.length === expectedRoles.length,
        };
      }),
  }));

  return {
    found: true,
    week: {
      weekNumber: week.weekNumber,
      year: week.year,
      startDate: week.startDate.toISOString(),
      endDate: week.endDate.toISOString(),
      president: week.president
        ? `${week.president.firstName} ${week.president.lastName}`
        : null,
      openingPrayer: week.openingPrayer
        ? `${week.openingPrayer.firstName} ${week.openingPrayer.lastName}`
        : null,
      biblicalReading: week.biblicalReading,
      sections: sectionsSummary,
      pendingSlots,
    },
  };
}

// ============================================
// Tool 4: Estadísticas de la congregación
// ============================================

export async function getCongregationStats(tenantId: string) {
  const [total, males, females, elders, servants, pioneers] = await Promise.all([
    prisma.publisher.count({ where: { tenantId: tenantId } }),
    prisma.publisher.count({ where: { tenantId: tenantId, gender: "MALE" } }),
    prisma.publisher.count({ where: { tenantId: tenantId, gender: "FEMALE" } }),
    prisma.publisher.count({ where: { tenantId: tenantId, isElder: true } }),
    prisma.publisher.count({ where: { tenantId: tenantId, isMinisterialServant: true } }),
    prisma.publisher.count({ where: { tenantId: tenantId, isPioneer: true } }),
  ]);

  // Cobertura de asignaciones en las semanas del mes actual
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const monthWeeks = await prisma.week.findMany({
    where: {
      tenantId,
      startDate: { gte: monthStart, lte: monthEnd },
    },
    include: {
      sections: {
        include: {
          items: { include: { assignments: true } },
        },
      },
    },
  });

  let totalSlots = monthWeeks.length > 0 ? 2 * monthWeeks.length : 0; // presidencia + oración inicial
  let filledSlots = monthWeeks.reduce(
    (count, week) =>
      count +
      (week.presidentId ? 1 : 0) +
      (week.openingPrayerId ? 1 : 0),
    0
  );

  for (const week of monthWeeks) {
    for (const section of week.sections) {
      for (const item of section.items) {
        if (
          item.title.toLowerCase().includes("palabras de introducción") ||
          (item.songNumber && !item.timeMinutes)
        ) {
          continue;
        }
        const expected = getExpectedRolesForItem(item);
        totalSlots += expected.length;
        filledSlots += item.assignments.length;
      }
    }
  }

  return {
    tenantId,
    stats: {
      totalPublishers: total,
      males,
      females,
      elders,
      ministerialServants: servants,
      pioneers,
    },
    currentMonthCoverage: {
      weeksInMonth: monthWeeks.length,
      totalSlots,
      filledSlots,
      coveragePercent:
        totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : null,
    },
  };
}
