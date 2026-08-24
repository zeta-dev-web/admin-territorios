"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Copiloto IA de VYMC — Chat con acceso a la base de datos vía Grok (Puter.js).
 * El modelo ejecuta herramientas (tool calling) contra el endpoint seguro
 * /api/ai/query-db (solo lectura y aislado por congregación).
 */

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type PuterToolCall = {
  id?: string;
  function?: { name?: string; arguments?: string };
  name?: string;
  arguments?: string;
};

type PuterChatMessage = {
  role: string;
  content: string | Array<{ text?: string }> | null;
  tool_calls?: PuterToolCall[];
};

type WireMessage = {
  role: string;
  content: string | Array<{ text?: string }> | null;
  tool_calls?: unknown[];
  tool_call_id?: string;
};

type ToolCallRequest = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

const AI_MODEL = "meta-llama/llama-4-maverick";

const AI_TOOLS = [
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
            description: "Nombre o apellido (o ambos) del publicador a buscar.",
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
            type: "string",
            description:
              "Tipo de sección: PRESIDENT, OPENING_PRAYER, TREASURES, BE_BETTER_TEACHERS, CHRISTIAN_LIFE o CLOSING_PRAYER.",
          },
          itemType: {
            type: "string",
            description: "Tipo de ítem: SPEECH, READING, DISCUSSION, CONDUCTOR_READER o PRAYER.",
          },
          role: {
            type: "string",
            description: "Rol: ASSIGNEE, STUDENT, HELPER, CONDUCTOR o READER.",
          },
          limit: { type: "number", description: "Cantidad máxima de resultados (1-15)." },
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
          weekNumber: { type: "number", description: "Número de semana del año (1-53)." },
          year: { type: "number", description: "Año (ej: 2026)." },
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

function buildSystemPrompt(): string {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const configuredPrompt = process.env.NEXT_PUBLIC_COPILOT_SYSTEM_PROMPT;
  if (!configuredPrompt) {
    throw new Error("Falta configurar NEXT_PUBLIC_COPILOT_SYSTEM_PROMPT en .env");
  }

  return configuredPrompt
    .replaceAll("{{TODAY}}", today)
    .replace(/\\n/g, "\n");
}

function normalizePuterResponse(response: unknown): {
  text: string;
  toolCalls: ToolCallRequest[];
} {
  const toolCalls: ToolCallRequest[] = [];
  let text = "";

  if (typeof response === "string") {
    return { text: response.trim(), toolCalls };
  }

  const responseObj = response as {
    text?: string;
    message?: {
      content?: string | Array<{ text?: string }>;
      tool_calls?: PuterToolCall[];
    };
    tool_calls?: PuterToolCall[];
  };

  if (responseObj?.message) {
    const content = responseObj.message.content;
    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      text = content.map((part) => part?.text ?? "").join("");
    }
    const rawCalls = responseObj.message.tool_calls ?? [];
    for (const call of rawCalls) {
      toolCalls.push({
        id: call.id ?? `${call.function?.name ?? call.name}-${toolCalls.length}`,
        name: call.function?.name ?? call.name ?? "",
        arguments: safeParseArgs(call.function?.arguments ?? call.arguments),
      });
    }
  } else if (responseObj?.text) {
    text = responseObj.text;
  }

  return { text: text.trim(), toolCalls };
}

function safeParseArgs(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

async function executeToolCall(call: ToolCallRequest): Promise<string> {
  try {
    const res = await fetch("/api/ai/query-db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool: call.name, args: call.arguments }),
    });
    const data = await res.json();
    return JSON.stringify(res.ok ? data : { error: data.error ?? "Error de consulta" });
  } catch {
    return JSON.stringify({ error: "No se pudo contactar el servidor" });
  }
}

async function waitForPuter(maxAttempts = 20): Promise<PuterJs | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const puter = (window as unknown as { puter?: PuterJs }).puter;
    if (puter?.ai?.chat) return puter;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return null;
}

type PuterJs = {
  ai: {
    chat: (
      messages: unknown,
      options?: Record<string, unknown>
    ) => Promise<unknown>;
  };
};

const QUICK_SUGGESTIONS = [
  "¿Qué partes faltan por asignar esta semana?",
  "¿Quiénes llevan más tiempo sin una asignación?",
  "Dame un resumen de la congregación",
];

export function CopilotChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [toolStatus, setToolStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading, toolStatus]);

  const runConversation = async (history: WireMessage[]) => {
    const puter = await waitForPuter();
    if (!puter) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "El servicio de IA (Puter.js) no está disponible en este momento. Recarga la página e inténtalo de nuevo.",
        },
      ]);
      return;
    }

    try {
      let conversation = history;

      for (let iteration = 0; iteration < 6; iteration++) {
        setToolStatus(
          iteration === 0
            ? "Consultando base de datos..."
            : "Analizando resultados..."
        );

        const response = await puter.ai.chat(conversation, {
          model: AI_MODEL,
          tools: AI_TOOLS,
        });

        const { text, toolCalls } = normalizePuterResponse(response);

        if (toolCalls.length === 0) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                text ||
                "No pude generar una respuesta. Intenta reformular tu pregunta.",
            },
          ]);
          return;
        }

        // Registrar el mensaje del asistente con sus tool calls y ejecutarlos
        conversation = [
          ...conversation,
          {
            role: "assistant",
            content: text || "",
            tool_calls: toolCalls.map((call) => ({
              id: call.id,
              type: "function",
              function: {
                name: call.name,
                arguments: JSON.stringify(call.arguments),
              },
            })),
          },
        ];

        for (const call of toolCalls) {
          if (!call.name) continue;
          const result = await executeToolCall(call);
          conversation = [
            ...conversation,
            {
              role: "tool",
              tool_call_id: call.id,
              content: result,
            },
          ];
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "La consulta requirió demasiados pasos. Intenta con una pregunta más específica.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Ocurrió un error al consultar la IA. Verifica tu conexión e inténtalo de nuevo.",
        },
      ]);
    } finally {
      setToolStatus(null);
      setIsLoading(false);
    }
  };

  const sendMessage = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const history: PuterChatMessage[] = [
      { role: "system", content: buildSystemPrompt() },
      ...updatedMessages.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    await runConversation(history);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#2C5282] to-[#1A365D] text-[#ffffff] shadow-xl transition-transform hover:scale-105 active:scale-95"
          title="Abrir Copiloto IA"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-purple-400 opacity-60"></span>
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-purple-500 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] max-h-[85vh] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
          {/* Encabezado */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#2C5282] to-[#1A365D] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Copiloto VYMC</p>
                <p className="text-[11px] text-white/70">
                  Sistema de IA · conectado a tu congregación
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8F9FA] px-3 py-4">
            {messages.length === 0 && (
              <div className="space-y-3 px-1">
                <div className="rounded-2xl rounded-tl-sm border border-[#E2E8F0] bg-white p-3 text-sm text-[#4A5568]">
                  ¡Hola! Soy tu copiloto. Puedo consultarte historial de
                  asignaciones, semanas del programa y estadísticas de la
                  congregación. ¿En qué te ayudo?
                </div>
                <div className="space-y-1.5 pt-1">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-left text-xs text-[#2C5282] transition-colors hover:border-[#2C5282] hover:bg-blue-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-[#2C5282] text-white"
                      : "rounded-tl-sm border border-[#E2E8F0] bg-white text-[#2D3748]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#718096]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#2C5282]" />
                  {toolStatus ?? "Pensando..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Entrada de texto */}
          <div className="flex items-center gap-2 border-t border-[#E2E8F0] bg-white px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta..."
              disabled={isLoading}
              className="h-9 flex-1 rounded-full border border-[#E2E8F0] bg-[#F8F9FA] px-4 text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:border-[#2C5282] focus:outline-none disabled:opacity-60"
            />
            <Button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full bg-[#2C5282] hover:bg-[#1A365D]"
              title="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
