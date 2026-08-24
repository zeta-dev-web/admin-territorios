import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from '@/lib/auth'
import {
  getTerritoryHistory,
  getPublisherTerritoryHistory,
  getTerritoryStatus,
  getAvailableTerritories,
  getTerritoriesStats,
} from "@/services/ai-tools-territorios.service";

/**
 * Endpoint seguro de solo lectura para las herramientas del Copiloto IA de Territorios.
 * - Requiere sesión activa.
 * - Lista blanca estricta de herramientas (no ejecuta SQL arbitrario).
 * - Aislamiento multinquilino: siempre usa session.tenantId.
 */

const queryTerritoriosSchema = z.discriminatedUnion("tool", [
  z.object({
    tool: z.literal("getTerritoryHistory"),
    args: z.object({
      territoryNumber: z.number().int().min(1).max(9999),
    }),
  }),
  z.object({
    tool: z.literal("getPublisherTerritoryHistory"),
    args: z.object({
      publisherName: z.string().min(2).max(120),
    }),
  }),
  z.object({
    tool: z.literal("getTerritoryStatus"),
    args: z.object({
      territoryNumber: z.number().int().min(1).max(9999),
    }),
  }),
  z.object({
    tool: z.literal("getAvailableTerritories"),
    args: z.object({
      groupName: z.string().max(100).optional(),
      includePersonalAssignments: z.boolean().optional(),
    }),
  }),
  z.object({
    tool: z.literal("getTerritoriesStats"),
    args: z.object({}).strict(),
  }),
]);

// POST /api/ai/query-territorios
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = queryTerritoriosSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Herramienta o argumentos inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const tenantId = session.tenantId;
    const { tool, args } = validationResult.data;

    let result: unknown;
    switch (tool) {
      case "getTerritoryHistory":
        result = await getTerritoryHistory(tenantId, args);
        break;
      case "getPublisherTerritoryHistory":
        result = await getPublisherTerritoryHistory(tenantId, args);
        break;
      case "getTerritoryStatus":
        result = await getTerritoryStatus(tenantId, args);
        break;
      case "getAvailableTerritories":
        result = await getAvailableTerritories(tenantId, args);
        break;
      case "getTerritoriesStats":
        result = await getTerritoriesStats(tenantId);
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error en /api/ai/query-territorios:", error);
    return NextResponse.json(
      { error: "Error al consultar la base de datos" },
      { status: 500 }
    );
  }
}
