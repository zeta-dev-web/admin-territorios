import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import {
  buildSystemPrompt,
  executeCopilotTool,
  getToolsForModule,
  type CopilotModule,
} from "@/lib/ai/copilot-config";
import {
  chatCompletion,
  type ChatMessage,
} from "@/lib/ai/llm";
import { checkRateLimit } from "@/lib/ai/rate-limit";

const MAX_TOOL_ITERATIONS = 3;
const MAX_HISTORY_MESSAGES = 20;

const chatRequestSchema = z.object({
  module: z.enum(["vymc", "territorios"]),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(MAX_HISTORY_MESSAGES),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const rateLimit = checkRateLimit("copilot", session.userId);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error:
            rateLimit.reason === "user"
              ? "Alcanzaste el límite diario de consultas al copiloto. Volvé a intentarlo mañana."
              : "El copiloto alcanzó su límite diario de uso. Volvé a intentarlo mañana.",
        },
        { status: 429 }
      );
    }

    const moduleName: CopilotModule = parsed.data.module;
    const tenantId = session.tenantId;

    const wireMessages: ChatMessage[] = [
      { role: "system", content: buildSystemPrompt(moduleName) },
      ...parsed.data.messages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const tools = getToolsForModule(moduleName);

    for (let iteration = 0; iteration <= MAX_TOOL_ITERATIONS; iteration++) {
      const result = await chatCompletion({
        messages: wireMessages,
        tools: iteration < MAX_TOOL_ITERATIONS ? tools : undefined,
      });

      if (result.toolCalls.length === 0) {
        return NextResponse.json({
          reply:
            result.content ||
            "No pude generar una respuesta. Intentá reformular tu pregunta.",
          model: result.model,
          provider: result.provider,
        });
      }

      wireMessages.push({
        role: "assistant",
        content: result.content || "",
        tool_calls: result.toolCalls.map((call) => ({
          id: call.id,
          type: "function",
          function: {
            name: call.name,
            arguments: JSON.stringify(call.arguments),
          },
        })),
      });

      for (const call of result.toolCalls) {
        let toolResult: unknown;
        try {
          toolResult = await executeCopilotTool(
            moduleName,
            tenantId,
            call.name,
            call.arguments
          );
        } catch (error) {
          console.error(`[copiloto ${moduleName}] error en tool ${call.name}:`, error);
          toolResult = { error: "No se pudo consultar la base de datos" };
        }

        wireMessages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(toolResult),
        });
      }
    }

    return NextResponse.json({
      reply:
        "La consulta requirió demasiados pasos. Intentá con una pregunta más específica.",
      model: null,
    });
  } catch (error) {
    console.error("Error en /api/ai/chat:", error);
    return NextResponse.json(
      {
        error:
          "El servicio de IA no está disponible en este momento. Volvé a intentarlo más tarde.",
      },
      { status: 503 }
    );
  }
}
