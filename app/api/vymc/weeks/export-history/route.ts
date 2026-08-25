import { NextResponse } from "next/server";
import { getCurrentTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { buildWeeksHistoryWorkbook } from "@/lib/excel-publishers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SECTION_TITLES: Record<string, string> = {
  PRESIDENT: "Presidencia",
  OPENING_PRAYER: "Apertura",
  TREASURES: "Tesoros de la Biblia",
  BE_BETTER_TEACHERS: "Seamos Mejores Maestros",
  CHRISTIAN_LIFE: "Nuestra Vida Cristiana",
  CLOSING_PRAYER: "Oración Final",
};

const ROLE_LABELS: Record<string, string> = {
  ASSIGNEE: "Asignado",
  STUDENT: "Estudiante",
  HELPER: "Ayudante",
  CONDUCTOR: "Conductor",
  READER: "Lector",
};

// GET /api/vymc/weeks/export-history - Download the full assignment history as .xlsx
export async function GET() {
  try {
    const tenantId = await getCurrentTenantId();

    const weeks = await prisma.week.findMany({
      where: { tenantId },
      orderBy: [{ year: "asc" }, { weekNumber: "asc" }],
      select: {
        year: true,
        weekNumber: true,
        startDate: true,
        endDate: true,
        president: {
          select: { firstName: true, lastName: true },
        },
        openingPrayer: {
          select: { firstName: true, lastName: true },
        },
        sections: {
          orderBy: { order: "asc" },
          select: {
            sectionType: true,
            items: {
              orderBy: { order: "asc" },
              select: {
                order: true,
                title: true,
                assignments: {
                  include: {
                    publisher: {
                      select: { firstName: true, lastName: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const historyRows = [];

    for (const week of weeks) {
      // Special slots as explicit rows
      if (week.president) {
        historyRows.push({
          year: week.year,
          weekNumber: week.weekNumber,
          startDate: week.startDate.toISOString(),
          endDate: week.endDate.toISOString(),
          sectionTitle: SECTION_TITLES.PRESIDENT,
          partTitle: "Presidente",
          partOrder: 0,
          roleLabel: ROLE_LABELS.ASSIGNEE,
          publisherName: `${week.president.firstName} ${week.president.lastName}`,
        });
      }
      if (week.openingPrayer) {
        historyRows.push({
          year: week.year,
          weekNumber: week.weekNumber,
          startDate: week.startDate.toISOString(),
          endDate: week.endDate.toISOString(),
          sectionTitle: SECTION_TITLES.OPENING_PRAYER,
          partTitle: "Oración inicial",
          partOrder: 1,
          roleLabel: ROLE_LABELS.ASSIGNEE,
          publisherName: `${week.openingPrayer.firstName} ${week.openingPrayer.lastName}`,
        });
      }

      for (const section of week.sections) {
        for (const item of section.items) {
          for (const assignment of item.assignments) {
            historyRows.push({
              year: week.year,
              weekNumber: week.weekNumber,
              startDate: week.startDate.toISOString(),
              endDate: week.endDate.toISOString(),
              sectionTitle:
                SECTION_TITLES[section.sectionType] ?? section.sectionType,
              partTitle: item.title,
              partOrder: item.order,
              roleLabel: ROLE_LABELS[assignment.role] ?? assignment.role,
              publisherName: `${assignment.publisher.firstName} ${assignment.publisher.lastName}`,
            });
          }
        }
      }
    }

    const buffer = buildWeeksHistoryWorkbook(historyRows);
    const fileName = `historial-asignaciones-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error exporting history:", error);
    return NextResponse.json(
      { error: "Error al exportar el historial" },
      { status: 500 }
    );
  }
}
