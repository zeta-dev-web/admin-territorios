import { z } from "zod";
import {
  getCongregationStats,
  getLeastAssignedPublishers,
  getPublisherHistory,
  getWeekProgramDetails,
} from "@/services/ai-tools.service";
import {
  getAvailableTerritories,
  getTerritoryHistory,
  getTerritoryStatus,
  getTerritoriesStats,
  getPublisherTerritoryHistory,
} from "@/services/ai-tools-territorios.service";
import type { ToolDefinition } from "./llm";

export type CopilotModule = "vymc" | "territorios";

const VYMC_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "getPublisherHistory",
      description:
        "Obtiene el historial reciente (últimas 5 asignaciones) de un publicador/a de la congregación, incluyendo roles, partes y fechas.",
      parameters: {
        type: "object",
        properties: {
          publisherName: {
            type: "string",
            description:
              "Nombre o apellido (o ambos) del publicador a buscar.",
          },
        },
        required: ["publisherName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getLeastAssignedPublishers",
      description:
        "Lista publicadores elegibles ordenados por más tiempo sin asignación (los más postergados primero). Permite filtrar por reglas teocráticas de sección, tipo de parte y rol.",
      parameters: {
        type: "object",
        properties: {
          sectionType: {
            type: ["string", "null"],
            description:
              "Tipo de sección: PRESIDENT, OPENING_PRAYER, TREASURES, BE_BETTER_TEACHERS, CHRISTIAN_LIFE o CLOSING_PRAYER.",
          },
          itemType: {
            type: ["string", "null"],
            description:
              "Tipo de ítem: SPEECH, READING, DISCUSSION, CONDUCTOR_READER o PRAYER.",
          },
          role: {
            type: ["string", "null"],
            description: "Rol: ASSIGNEE, STUDENT, HELPER, CONDUCTOR o READER.",
          },
          limit: {
            type: ["number", "null"],
            description: "Cantidad máxima de resultados (1-15).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getWeekProgramDetails",
      description:
        "Devuelve el estado completo del programa de una semana: presidente, oración inicial, partes cubiertas, partes pendientes y huecos por llenar. Si no se indica semana, usa la actual.",
      parameters: {
        type: "object",
        properties: {
          weekNumber: {
            type: ["number", "null"],
            description: "Número de semana del año (1-53).",
          },
          year: {
            type: ["number", "null"],
            description: "Año (ej: 2026).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCongregationStats",
      description:
        "Estadísticas de la congregación: totales de publicadores, ancianos, siervos ministeriales, precursores y porcentaje de cobertura de asignaciones del mes actual.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const TERRITORIOS_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "getTerritoryHistory",
      description:
        "Obtiene el historial completo de un territorio específico: todas sus asignaciones regulares (conductores) y asignaciones personales, con fechas, duración y progreso de trabajo.",
      parameters: {
        type: "object",
        properties: {
          territoryNumber: {
            type: "number",
            description:
              "Número del territorio a consultar (ej: 15, 23, 105).",
          },
        },
        required: ["territoryNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getPublisherTerritoryHistory",
      description:
        "Lista el historial completo de territorios de un publicador: asignaciones como conductor, asignaciones personales y registros diarios de trabajo en manzanas.",
      parameters: {
        type: "object",
        properties: {
          publisherName: {
            type: "string",
            description:
              "Nombre o apellido (o ambos) del publicador a buscar.",
          },
        },
        required: ["publisherName"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTerritoryStatus",
      description:
        "Devuelve el estado actual de un territorio: conductor asignado, días activo, manzanas trabajadas, registros diarios recientes y asignaciones personales activas.",
      parameters: {
        type: "object",
        properties: {
          territoryNumber: {
            type: "number",
            description:
              "Número del territorio a consultar (ej: 15, 23, 105).",
          },
        },
        required: ["territoryNumber"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getAvailableTerritories",
      description:
        "Lista los territorios disponibles para asignar (sin conductor activo) y los que están asignados actualmente. Permite filtrar por grupo.",
      parameters: {
        type: "object",
        properties: {
          groupName: {
            type: ["string", "null"],
            description: "Nombre del grupo para filtrar (opcional).",
          },
          includePersonalAssignments: {
            type: ["boolean", "null"],
            description:
              "Si es true, incluye detalles de asignaciones personales activas en territorios disponibles.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getTerritoriesStats",
      description:
        "Estadísticas generales del sistema de territorios: totales de territorios, manzanas, grupos, asignaciones activas, porcentaje de cobertura, últimas asignaciones completadas y conductores más activos.",
      parameters: { type: "object", properties: {} },
    },
  },
];

const toolArgsSchemas = {
  getPublisherHistory: z.object({ publisherName: z.string().min(1).max(120) }),
  getLeastAssignedPublishers: z.object({
    sectionType: z.string().max(40).optional(),
    itemType: z.string().max(40).optional(),
    role: z.string().max(20).optional(),
    limit: z.number().int().min(1).max(15).optional(),
  }),
  getWeekProgramDetails: z.object({
    weekNumber: z.number().int().min(1).max(53).optional(),
    year: z.number().int().min(2000).max(2100).optional(),
  }),
  getCongregationStats: z.object({}).strict(),
  getTerritoryHistory: z.object({
    territoryNumber: z.number().int().min(1).max(9999),
  }),
  getPublisherTerritoryHistory: z.object({
    publisherName: z.string().min(1).max(120),
  }),
  getTerritoryStatus: z.object({
    territoryNumber: z.number().int().min(1).max(9999),
  }),
  getAvailableTerritories: z.object({
    groupName: z.string().max(100).optional(),
    includePersonalAssignments: z.boolean().optional(),
  }),
  getTerritoriesStats: z.object({}).strict(),
} as const;

export function getToolsForModule(module: CopilotModule): ToolDefinition[] {
  return module === "vymc" ? VYMC_TOOLS : TERRITORIOS_TOOLS;
}

function readEnvWithFallback(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) return value;
  }
  return undefined;
}

export function buildSystemPrompt(module: CopilotModule): string {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const configuredPrompt =
    module === "vymc"
      ? readEnvWithFallback(
          "AI_COPILOT_SYSTEM_PROMPT",
          "NEXT_PUBLIC_COPILOT_SYSTEM_PROMPT"
        )
      : readEnvWithFallback(
          "AI_COPILOT_TERRITORIOS_SYSTEM_PROMPT",
          "NEXT_PUBLIC_COPILOT_TERRITORIOS_SYSTEM_PROMPT"
        );

  if (!configuredPrompt) {
    throw new Error(
      `Falta configurar el system prompt del copiloto (${module}) en .env`
    );
  }

  return configuredPrompt
    .replaceAll("{{TODAY}}", today)
    .replace(/\\n/g, "\n");
}

export async function executeCopilotTool(
  module: CopilotModule,
  tenantId: string,
  toolName: string,
  args: Record<string, unknown>
): Promise<unknown> {
  const schema = toolArgsSchemas[toolName as keyof typeof toolArgsSchemas];

  if (!schema) {
    return { error: `Herramienta desconocida: ${toolName}` };
  }

  const cleanedArgs = Object.fromEntries(
    Object.entries(args ?? {}).filter(
      ([, value]) => value !== null && value !== undefined && value !== ""
    )
  );

  const parsed = schema.safeParse(cleanedArgs);
  if (!parsed.success) {
    return {
      error: "Argumentos inválidos",
      details: parsed.error.issues.map((issue) => issue.message),
    };
  }

  const validArgs = parsed.data as Record<string, unknown>;

  if (module === "vymc") {
    switch (toolName) {
      case "getPublisherHistory":
        return getPublisherHistory(tenantId, validArgs as never);
      case "getLeastAssignedPublishers":
        return getLeastAssignedPublishers(tenantId, validArgs as never);
      case "getWeekProgramDetails":
        return getWeekProgramDetails(tenantId, validArgs as never);
      case "getCongregationStats":
        return getCongregationStats(tenantId);
    }
  }

  switch (toolName) {
    case "getTerritoryHistory":
      return getTerritoryHistory(tenantId, validArgs as never);
    case "getPublisherTerritoryHistory":
      return getPublisherTerritoryHistory(tenantId, validArgs as never);
    case "getTerritoryStatus":
      return getTerritoryStatus(tenantId, validArgs as never);
    case "getAvailableTerritories":
      return getAvailableTerritories(tenantId, validArgs as never);
    case "getTerritoriesStats":
      return getTerritoriesStats(tenantId);
  }

  return { error: `Herramienta no disponible para el módulo ${module}` };
}
