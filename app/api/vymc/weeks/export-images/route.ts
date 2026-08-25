import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { renderToBuffer } from "@react-pdf/renderer";
import { getCurrentTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { generatePDFDocument } from "@/lib/pdf-template";
import JSZip from "jszip";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = require("@napi-rs/canvas").createCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") };
  }

  reset(canvasAndContext: { canvas: { width: number; height: number }; context: unknown }, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: { canvas: { width: number; height: number }; context: unknown }) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

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

    // Transform data for PDF (same as export-pdf)
    const weeksData = weeks.map((week) => {
      let openingSongNumber: number | undefined;
      let closingSongNumber: number | undefined;
      let closingPrayerName: string | undefined;

      week.sections.forEach((section) => {
        if (section.sectionType === "OPENING_PRAYER") {
          const songItem = section.items.find((item) => item.songNumber);
          if (songItem && songItem.songNumber) openingSongNumber = songItem.songNumber;
        }
        if (section.sectionType === "CHRISTIAN_LIFE") {
          const songs = section.items.filter((item) => item.songNumber);
          if (songs.length > 0) {
            const lastSong = songs[songs.length - 1];
            if (lastSong.songNumber) closingSongNumber = lastSong.songNumber;
          }
        }
        if (section.sectionType === "CLOSING_PRAYER") {
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
    const pdfBuffer = await renderToBuffer(pdfDocument);

    // Rasterize the exact PDF output on the server. This avoids browser workers,
    // canvas compatibility issues and keeps the image export identical to PDF.
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const pdf = await pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      useSystemFonts: true,
      standardFontDataUrl: pathToFileURL(`${path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts")}${path.sep}`).href,
      CanvasFactory: NodeCanvasFactory,
    }).promise;
    const zip = new JSZip();
    const canvasFactory = new NodeCanvasFactory();

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 2 });
      const canvasAndContext = canvasFactory.create(viewport.width, viewport.height);

      await page.render({
        canvasContext: canvasAndContext.context as CanvasRenderingContext2D,
        viewport,
        canvas: canvasAndContext.canvas as unknown as HTMLCanvasElement,
      }).promise;

      const image = canvasAndContext.canvas.toBuffer("image/png");
      zip.file(`pagina-${String(pageNumber).padStart(2, "0")}.png`, image);
      page.cleanup();
      canvasFactory.destroy(canvasAndContext);
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const fileName = `programas-semanas-${tenant.name.replace(/[^a-zA-Z0-9_-]+/g, "-")}-imagenes.zip`;

    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "No autenticado") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    console.error("Error generating PDF for images:", error);
    return NextResponse.json(
      { error: "Error al generar las imágenes" },
      { status: 500 }
    );
  }
}
