import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from '@/lib/auth';
import { prisma } from "@/lib/prisma";
import {
  canAssignPublisher,
  getEligibilityDescription,
} from "@/lib/assignment-eligibility";
import { getAppointmentLabel } from "@/services/ai-tools.service";

/**
 * Motor de Sugerencia Inteligente por Ítem ("Sugerir Candidato").
 * Reglas aplicadas:
 * 1. Elegibilidad teocrática estricta (género, nombramiento, bautismo) según sección/rol.
 * 2. Excluye publicadores que ya tienen una asignación en la misma semana
 *    (incluye presidencia y oración inicial). Si no alcanzan candidatos, completa
 *    marcándolos como `alreadyAssignedThisWeek`.
 * 3. En demostraciones, el ayudante debe ser del MISMO género que el estudiante asignado.
 * 4. Ordena por lastAssignedAt ASC (prioridad a los más postergados).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

const suggestSchema = z.object({
  weekItemId: z.string().min(1),
  role: z.enum(["ASSIGNEE", "STUDENT", "HELPER", "CONDUCTOR", "READER"]),
  limit: z.number().int().min(1).max(10).optional(),
});

// POST /api/ai/suggest-candidates
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = suggestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { weekItemId, role, limit = 3 } = validationResult.data;
    const tenantId = session.tenantId;

    const weekItem = await prisma.weekItem.findUnique({
      where: { id: weekItemId },
      include: {
        assignments: {
          include: {
            publisher: { select: { gender: true } },
          },
        },
        weekSection: {
          include: {
            week: {
              include: {
                sections: {
                  include: {
                    items: {
                      include: {
                        assignments: {
                          select: { publisherId: true, role: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!weekItem) {
      return NextResponse.json(
        { error: "Elemento no encontrado" },
        { status: 404 }
      );
    }

    const week = weekItem.weekSection.week;
    if (week.tenantId !== tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sectionType = weekItem.weekSection.sectionType;
    const itemType = weekItem.itemType;

    // Publicadores ya ocupados en esta semana (asignaciones + presidencia + oración)
    const usedThisWeek = new Set<string>();
    for (const section of week.sections) {
      for (const item of section.items) {
        for (const assignment of item.assignments) {
          usedThisWeek.add(assignment.publisherId);
        }
      }
    }
    if (week.presidentId) usedThisWeek.add(week.presidentId);
    if (week.openingPrayerId) usedThisWeek.add(week.openingPrayerId);

    // Regla de género para pares Estudiante/Ayudante
    let requiredGender: "MALE" | "FEMALE" | null = null;
    if (role === "HELPER") {
      const student = weekItem.assignments.find((a) => a.role === "ASSIGNEE");
      if (student) requiredGender = student.publisher.gender;
    } else if (role === "ASSIGNEE" && sectionType === "BE_BETTER_TEACHERS") {
      const helper = weekItem.assignments.find((a) => a.role === "HELPER");
      if (helper) requiredGender = helper.publisher.gender;
    }

    const publishers = await prisma.publisher.findMany({
      where: { tenantId },
    });

    const now = new Date();
    const weekStart = new Date(week.startDate);

    const eligible = publishers.filter((publisher) => {
      if (!canAssignPublisher(publisher, { sectionType, itemType, role })) {
        return false;
      }
      if (
        requiredGender &&
        sectionType === "BE_BETTER_TEACHERS" &&
        itemType !== "SPEECH" &&
        publisher.gender !== requiredGender
      ) {
        return false;
      }
      return true;
    });

    if (eligible.length === 0) {
      return NextResponse.json({
        candidates: [],
        message: `No hay publicadores elegibles. Requisitos: ${getEligibilityDescription({ sectionType, itemType, role })}`,
      });
    }

    const sortBySeniority = (list: typeof eligible) =>
      [...list].sort((a, b) => {
        if (a.lastAssignedAt === null && b.lastAssignedAt !== null) return -1;
        if (a.lastAssignedAt !== null && b.lastAssignedAt === null) return 1;
        if (a.lastAssignedAt && b.lastAssignedAt) {
          return a.lastAssignedAt.getTime() - b.lastAssignedAt.getTime();
        }
        return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      });

    const free = sortBySeniority(eligible.filter((p) => !usedThisWeek.has(p.id)));
    const busy = sortBySeniority(eligible.filter((p) => usedThisWeek.has(p.id)));

    const candidates = [...free, ...busy].slice(0, limit).map((publisher, index) => ({
      rank: index + 1,
      id: publisher.id,
      fullName: `${publisher.firstName} ${publisher.lastName}`,
      gender: publisher.gender,
      appointmentLabel: getAppointmentLabel(publisher),
      isPioneer: publisher.isPioneer,
      daysSinceLastAssignment: publisher.lastAssignedAt
        ? daysBetween(new Date(publisher.lastAssignedAt), now)
        : null,
      weeksUntilWeek:
        publisher.lastAssignedAt && publisher.lastAssignedAt <= weekStart
          ? Math.floor(daysBetween(publisher.lastAssignedAt, weekStart) / (7 * MS_PER_DAY))
          : null,
      alreadyAssignedThisWeek: usedThisWeek.has(publisher.id),
    }));

    return NextResponse.json({
      candidates,
      requirements: getEligibilityDescription({ sectionType, itemType, role }),
    });
  } catch (error) {
    console.error("Error en /api/ai/suggest-candidates:", error);
    return NextResponse.json(
      { error: "Error al generar sugerencias" },
      { status: 500 }
    );
  }
}
