import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from '@/lib/auth';
import { prisma } from "@/lib/prisma";
import { enqueueMessage } from "@/lib/whatsapp/queue";
import {
  generateMonthlySummaryMessage,
  MonthlyAssignmentEntry,
} from "@/lib/ai/whatsapp-ai";
import {
  ROLE_LABELS,
  SECTION_TITLES,
} from "@/components/vymc/week-display-config";

/**
 * Envío masivo de asignaciones del mes:
 * - Agrupa TODAS las asignaciones de cada publicador del mes en UN solo mensaje.
 * - GET  → vista previa: destinatarios, asignaciones y mensaje exacto a enviar.
 * - POST → encola los mensajes en la cola antiban (escribiendo... + 15-20s aleatorios).
 */

const monthParamsSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

const sendBulkSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  publisherIds: z.array(z.string()).min(1).max(300),
});

function cleanItemTitle(title: string): string {
  return title
    .replace(/Canción\s*\d+\s*(y oración\s*)?\s*\|\s*/i, "")
    .replace(/\s*\(\)\s*$/, "")
    .trim();
}

async function loadMonthWeeks(
  tenantId: string,
  month: number,
  year: number
) {
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return prisma.week.findMany({
    where: {
      tenantId,
      startDate: { gte: monthStart, lte: monthEnd },
    },
    orderBy: { startDate: "asc" },
    include: {
      president: {
        select: { id: true, firstName: true, lastName: true, gender: true, phone: true },
      },
      openingPrayer: {
        select: { id: true, firstName: true, lastName: true, gender: true, phone: true },
      },
      sections: {
        orderBy: { order: "asc" },
        include: {
          items: {
            orderBy: { order: "asc" },
            include: {
              assignments: {
                include: {
                  publisher: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      gender: true,
                      phone: true,
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
}

function buildMonthLabel(month: number, year: number): string {
  const label = new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("es-AR", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function buildDateLabel(weekStartDate: Date): string {
  return weekStartDate.toLocaleDateString("es-AR", {
    timeZone: "UTC",
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

type PublisherRef = {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  phone: string | null;
};

function collectRecipients(
  weeks: Awaited<ReturnType<typeof loadMonthWeeks>>,
  monthLabel: string
): Array<{
  publisher: PublisherRef;
  entries: MonthlyAssignmentEntry[];
  message: string;
}> {
  const byPublisher = new Map<
    string,
    { publisher: PublisherRef; entries: Array<MonthlyAssignmentEntry & { sortKey: number }> }
  >();

  const addEntry = (
    publisher: PublisherRef,
    entry: MonthlyAssignmentEntry,
    sortKey: number
  ) => {
    const current = byPublisher.get(publisher.id);
    if (current) {
      current.entries.push({ ...entry, sortKey });
    } else {
      byPublisher.set(publisher.id, {
        publisher,
        entries: [{ ...entry, sortKey }],
      });
    }
  };

  for (const week of weeks) {
    const dateLabel = buildDateLabel(week.startDate);
    const baseSort = week.startDate.getTime();

    if (week.president) {
      addEntry(
        week.president as PublisherRef,
        {
          dateLabel,
          partTitle: "Presidencia de la reunión",
          roleLabel: "Presidente",
          sectionTitle: SECTION_TITLES.PRESIDENT,
        },
        baseSort
      );
    }
    if (week.openingPrayer) {
      addEntry(
        week.openingPrayer as PublisherRef,
        {
          dateLabel,
          partTitle: "Oración inicial",
          roleLabel: "Oración de apertura",
          sectionTitle: SECTION_TITLES.OPENING_PRAYER,
        },
        baseSort + 1
      );
    }

    for (const section of week.sections) {
      for (const item of section.items) {
        const isPureSong = !!item.songNumber && !item.timeMinutes;
        const isIntroWords = item.title.toLowerCase().includes("palabras de introducción");
        if (isPureSong || isIntroWords || item.assignments.length === 0) continue;

        for (const assignment of item.assignments) {
          addEntry(
            assignment.publisher as PublisherRef,
            {
              dateLabel,
              partTitle: cleanItemTitle(item.title),
              roleLabel: ROLE_LABELS[assignment.role] ?? assignment.role,
              sectionTitle:
                SECTION_TITLES[section.sectionType] ?? section.sectionType,
              durationMinutes: item.timeMinutes,
            },
            baseSort + section.order * 100 + item.order
          );
        }
      }
    }
  }

  return [...byPublisher.values()]
    .map(({ publisher, entries }) => {
      const sortedEntries = [...entries].sort((a, b) => a.sortKey - b.sortKey);
      const message = generateMonthlySummaryMessage({
        publisherName: `${publisher.firstName} ${publisher.lastName}`,
        gender: publisher.gender === "FEMALE" ? "FEMALE" : "MALE",
        monthLabel,
        entries: sortedEntries.map((entry) => ({
          dateLabel: entry.dateLabel,
          partTitle: entry.partTitle,
          roleLabel: entry.roleLabel,
          sectionTitle: entry.sectionTitle,
          durationMinutes: entry.durationMinutes,
        })),
      });
      return { publisher, entries: sortedEntries, message };
    })
    .sort((a, b) =>
      `${a.publisher.lastName} ${a.publisher.firstName}`.localeCompare(
        `${b.publisher.lastName} ${b.publisher.firstName}`
      )
    );
}

// GET /api/whatsapp/bulk?month=8&year=2026
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const validationResult = monthParamsSchema.safeParse({
      month: searchParams.get("month") ?? new Date().getMonth() + 1,
      year: searchParams.get("year") ?? new Date().getFullYear(),
    });
    if (!validationResult.success) {
      return NextResponse.json({ error: "Mes o año inválido" }, { status: 400 });
    }

    const { month, year } = validationResult.data;
    const weeks = await loadMonthWeeks(session.tenantId, month, year);
    const monthLabel = buildMonthLabel(month, year);
    const recipients = collectRecipients(weeks, monthLabel).map(
      ({ publisher, entries, message }) => ({
        publisherId: publisher.id,
        fullName: `${publisher.firstName} ${publisher.lastName}`,
        phone: publisher.phone,
        gender: publisher.gender,
        assignmentsCount: entries.length,
        message,
      })
    );

    return NextResponse.json({
      monthLabel,
      weeksCount: weeks.length,
      recipients,
      stats: {
        total: recipients.length,
        withPhone: recipients.filter((recipient) => recipient.phone).length,
        withoutPhone: recipients.filter((recipient) => !recipient.phone).length,
      },
    });
  } catch (error) {
    console.error("Error generando vista previa mensual:", error);
    return NextResponse.json(
      { error: "Error al generar la vista previa" },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/bulk
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = sendBulkSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { month, year, publisherIds } = validationResult.data;
    const selectedIds = new Set(publisherIds);

    const weeks = await loadMonthWeeks(session.tenantId, month, year);
    const monthLabel = buildMonthLabel(month, year);
    const recipients = collectRecipients(weeks, monthLabel);

    let queued = 0;
    const skipped: Array<{ fullName: string; reason: string }> = [];

    for (const { publisher, message, entries } of recipients) {
      if (!selectedIds.has(publisher.id)) continue;

      if (!publisher.phone) {
        skipped.push({
          fullName: `${publisher.firstName} ${publisher.lastName}`,
          reason: "sin teléfono cargado",
        });
        continue;
      }

      enqueueMessage({
        phone: publisher.phone,
        message,
        recipientLabel: `${publisher.firstName} ${publisher.lastName} · ${entries.length} asignaciones (${monthLabel})`,
        userId: session.userId,
      });
      queued++;
    }

    return NextResponse.json({ queued, skipped }, { status: 202 });
  } catch (error) {
    console.error("Error encolando envío masivo:", error);
    return NextResponse.json(
      { error: "Error al encolar los mensajes" },
      { status: 500 }
    );
  }
}
