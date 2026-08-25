import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { chatCompletion } from "@/lib/ai/llm";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { generateTemplateMessage } from "@/lib/ai/whatsapp-ai";

const messageParamsSchema = z.object({
  publisherName: z.string().min(1).max(120),
  gender: z.enum(["MALE", "FEMALE"]),
  roleLabel: z.string().min(1).max(120),
  partTitle: z.string().min(1).max(300),
  sectionTitle: z.string().min(1).max(200),
  weekRangeText: z.string().min(1).max(120),
  durationMinutes: z.number().int().min(0).max(120).nullable().optional(),
  songNumber: z.number().int().min(0).max(200).nullable().optional(),
  biblicalReading: z.string().max(200).nullable().optional(),
  helperName: z.string().max(160).nullable().optional(),
  assignedName: z.string().max(160).nullable().optional(),
  tone: z.enum(["FRATERNAL", "FORMAL", "REMINDER"]).optional(),
});

function readToneInstructions(tone: string): string | undefined {
  const newKey = `AI_WHATSAPP_PROMPT_${tone}`;
  const legacyKey = `NEXT_PUBLIC_WHATSAPP_PROMPT_${tone}`;
  for (const key of [newKey, legacyKey]) {
    const value = process.env[key];
    if (value && value.trim()) return value;
  }
  return undefined;
}

function buildPrompt(params: z.infer<typeof messageParamsSchema>): string {
  const {
    publisherName,
    gender,
    roleLabel,
    partTitle,
    sectionTitle,
    weekRangeText,
    durationMinutes,
    helperName,
    assignedName,
    tone = "FRATERNAL",
  } = params;

  const prefix = gender === "MALE" ? "hermano" : "hermana";
  const durationText =
    durationMinutes ? `${durationMinutes} minutos` : "no especificada";

  const toneInstructions = readToneInstructions(tone);
  if (!toneInstructions) {
    throw new Error(`Falta configurar AI_WHATSAPP_PROMPT_${tone} en .env`);
  }

  return `
Eres un asistente teocrático para la congregación de los Testigos de Jehová.
Redacta un mensaje de WhatsApp para notificar a un publicador sobre su asignación en la reunión "Vida y Ministerio Cristianos".

Datos de la asignación:
- Destinatario: ${prefix} ${publisherName}
- Género: ${gender === "MALE" ? "Varón" : "Mujer"}
- Semana de la reunión: ${weekRangeText}
- Sección de la reunión: ${sectionTitle}
- Título de la parte: ${partTitle}
- Rol: ${roleLabel}
- Tiempo de duración: ${durationText}
${helperName ? `- Ayudante con quien presenta la parte: ${helperName}` : ""}
${assignedName ? `- Asignado principal de la parte: ${assignedName}` : ""}

Instrucciones de formato y estilo:
- ${toneInstructions}
- Usa formato de WhatsApp con asteriscos para negritas (ej: *Semana del...*, *Parte:*).
- Organiza el mensaje en líneas cortas y separa saludo, detalles de la asignación y despedida con líneas en blanco.
- Incluye siempre los datos disponibles: semana, sección, parte, rol, duración y compañero o asignado principal cuando corresponda.
- Conserva literalmente estas etiquetas: *Semana del*, *Sección de la reunión*, *Parte*, *Rol*, *Duración* y *Asignado principal*.
- Respeta exactamente la cantidad y ubicación de emojis indicada por el prompt del tono; no agregues emojis por iniciativa propia.
- No inventes frases, títulos ni datos que no estén incluidos en la información recibida.
- Sé claro, preciso y respetuoso.
- Devuelve ÚNICAMENTE el texto listo para enviar por WhatsApp, sin explicaciones ni comillas al inicio o final.
`.trim();
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = messageParamsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const params = parsed.data;

    try {
      const rateLimit = checkRateLimit("whatsapp-ai", session.userId);
      if (!rateLimit.allowed) {
        throw new Error("rate-limit");
      }

      const result = await chatCompletion({
        messages: [{ role: "user", content: buildPrompt(params) }],
      });

      if (result.content && result.content.trim().length > 20) {
        return NextResponse.json({
          message: result.content.trim(),
          source: "ai",
        });
      }
    } catch (error) {
      console.warn("[whatsapp-ai] IA no disponible, usando plantilla:", error);
    }

    return NextResponse.json({
      message: generateTemplateMessage(params),
      source: "template",
    });
  } catch (error) {
    console.error("Error en /api/ai/whatsapp-message:", error);
    return NextResponse.json(
      { error: "Error al generar el mensaje" },
      { status: 500 }
    );
  }
}
