import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { generatePDFDocument } from "@/lib/pdf-template";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId();
    const body = await request.json();
    const { weekIds } = body;

    if (!Array.isArray(weekIds) || weekIds.length === 0) {
      return NextResponse.json(
        { error: "Debe proporcionar al menos una semana" },
        { status: 400 }
      );
    }

    // Fetch the tenant (congregation)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Congregación no encontrada" },
        { status: 404 }
      );
    }

    // Fetch weeks with all related data
    const weeks = await prisma.week.findMany({
      where: {
        id: { in: weekIds },
        tenantId,
      },
      include: {
        president: true,
        openingPrayer: true,
        sections: {
          orderBy: { order: "asc" },
          include: {
            items: {
              orderBy: { order: "asc" },
              include: {
                assignments: {
                  include: {
                    publisher: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ year: "asc" }, { weekNumber: "asc" }],
    });

    // Transform data for PDF
    const weeksData = weeks.map((week) => {
      // Find opening and closing song numbers from OPENING_PRAYER and CLOSING_PRAYER sections
      let openingSongNumber: number | undefined;
      let closingSongNumber: number | undefined;
      let closingPrayerName: string | undefined;

      week.sections.forEach((section) => {
        if (section.sectionType === "OPENING_PRAYER") {
          const songItem = section.items.find((item) => item.songNumber);
          if (songItem && songItem.songNumber) openingSongNumber = songItem.songNumber;
        }
        if (section.sectionType === "CHRISTIAN_LIFE") {
          // Last song in Christian Life section is the closing song
          const songs = section.items.filter((item) => item.songNumber);
          if (songs.length > 0) {
            const lastSong = songs[songs.length - 1];
            if (lastSong.songNumber) closingSongNumber = lastSong.songNumber;
          }
        }
        if (section.sectionType === "CLOSING_PRAYER") {
          // Get the person assigned to closing prayer
          const prayerItem = section.items.find((item) => item.itemType === "PRAYER");
          if (prayerItem && prayerItem.assignments.length > 0) {
            const assignment = prayerItem.assignments[0];
            closingPrayerName = `${assignment.publisher.firstName} ${assignment.publisher.lastName}`;
          }
        }
      });

      return {
        weekNumber: week.weekNumber,
        year: week.year,
        startDate: week.startDate.toISOString().split("T")[0],
        endDate: week.endDate.toISOString().split("T")[0],
        presidentName: week.president
          ? `${week.president.firstName} ${week.president.lastName}`
          : undefined,
        openingPrayerName: week.openingPrayer
          ? `${week.openingPrayer.firstName} ${week.openingPrayer.lastName}`
          : undefined,
        closingPrayerName,
        openingSongNumber,
        closingSongNumber,
        biblicalReading: week.biblicalReading ?? undefined,
        sections: week.sections.map((section) => ({
          sectionType: section.sectionType,
          title: section.sectionType,
          items: section.items.map((item) => ({
            order: item.order,
            title: item.title,
            timeMinutes: item.timeMinutes ?? undefined,
            songNumber: item.songNumber ?? undefined,
            itemType: item.itemType,
            requiresStudentHelper: item.requiresStudentHelper,
            assignments: item.assignments.map((assignment) => ({
              publisherName: `${assignment.publisher.firstName} ${assignment.publisher.lastName}`,
              role: assignment.role,
            })),
          })),
        })),
      };
    });

    // Generate PDF
    const pdfDocument = generatePDFDocument(tenant.name, weeksData);
    const buffer = await renderToBuffer(pdfDocument);

    // Return PDF as response
    return new NextResponse(Buffer.from(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="programas-semanas-${tenant.name.replace(/\s+/g, "-")}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error generating PDF:", error);
    return NextResponse.json(
      { error: "Error al generar el PDF" },
      { status: 500 }
    );
  }
}
