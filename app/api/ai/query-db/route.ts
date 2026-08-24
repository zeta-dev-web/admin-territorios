import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from '@/lib/auth'
import {
  getCongregationStats,
  getLeastAssignedPublishers,
  getPublisherHistory,
  getWeekProgramDetails,
} from "@/services/ai-tools.service";

/**
 * Endpoint seguro de solo lectura para las herramientas del Copiloto IA.
 * - Requiere sesión activa.
 * - Lista blanca estricta de herramientas (no ejecuta SQL arbitrario).
 * - Aislamiento multinquilino: siempre usa session.tenantId.
 */

const queryDbSchema = z.discriminatedUnion("tool", [
  z.object({
    tool: z.literal("getPublisherHistory"),
    args: z.object({
      publisherName: z.string().min(2).max(120),
    }),
  }),
  z.object({
    tool: z.literal("getLeastAssignedPublishers"),
    args: z.object({
      sectionType: z.string().max(40).optional(),
      itemType: z.string().max(40).optional(),
      role: z.string().max(20).optional(),
      limit: z.number().int().min(1).max(15).optional(),
    }),
  }),
  z.object({
    tool: z.literal("getWeekProgramDetails"),
    args: z.object({
      weekNumber: z.number().int().min(1).max(53).optional(),
      year: z.number().int().min(2000).max(2100).optional(),
    }),
  }),
  z.object({
    tool: z.literal("getCongregationStats"),
    args: z.object({}).strict(),
  }),
]);

// POST /api/ai/query-db
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = queryDbSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Herramienta o argumentos inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const congregationId = session.tenantId;
    const { tool, args } = validationResult.data;

    let result: unknown;
    switch (tool) {
      case "getPublisherHistory":
        result = await getPublisherHistory(congregationId, args);
        break;
      case "getLeastAssignedPublishers":
        result = await getLeastAssignedPublishers(congregationId, args);
        break;
      case "getWeekProgramDetails":
        result = await getWeekProgramDetails(congregationId, args);
        break;
      case "getCongregationStats":
        result = await getCongregationStats(congregationId);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en /api/ai/query-db:", error);
    return NextResponse.json(
      { error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
