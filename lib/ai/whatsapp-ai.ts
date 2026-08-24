/**
 * Servicio de Generación de Mensajes de WhatsApp con IA (Grok / Puter.js)
 * y plantillas de respaldo para el Sistema VYMC.
 */

export type MessageTone = "FRATERNAL" | "FORMAL" | "REMINDER";

export type AssignmentMessageParams = {
  publisherName: string;
  gender: "MALE" | "FEMALE";
  role: string;
  roleLabel: string;
  partTitle: string;
  sectionTitle: string;
  weekRangeText: string;
  durationMinutes?: number | null;
  songNumber?: number | null;
  biblicalReading?: string | null;
  helperName?: string | null;
  assignedName?: string | null;
  tone?: MessageTone;
};

/**
 * Generador de mensaje por plantilla determinista (Respaldo instantáneo sin latencia)
 */
export function generateTemplateMessage(params: AssignmentMessageParams): string {
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
  const durationText = durationMinutes ? ` (${durationMinutes} min)` : "";

  if (tone === "REMINDER") {
    return (
      `Estimado/a ${prefix} *${publisherName}*,\n\n` +
      `Le enviamos este breve recordatorio de su asignación para la reunión de la *${weekRangeText}*:\n\n` +
      `📌 *Sección:* ${sectionTitle}\n` +
      `📖 *Parte:* ${partTitle}${durationText}\n` +
      `👤 *Rol:* ${roleLabel}\n` +
      (assignedName ? `👤 *Asignado principal:* ${assignedName}\n` : "") +
      (helperName ? `👥 *Ayudante:* ${helperName}\n` : "") +
      `\nEsperamos que tenga una excelente preparación. ¡Muchos saludos!`
    );
  }

  if (tone === "FORMAL") {
    return (
      `Estimado/a ${prefix} *${publisherName}*:\n\n` +
      `Por medio del presente le informamos sobre su participación programada para la *${weekRangeText}*:\n\n` +
      `• *Sección:* ${sectionTitle}\n` +
      `• *Asignación:* ${partTitle}${durationText}\n` +
      `• *Rol:* ${roleLabel}\n` +
      (assignedName ? `• *Asignado principal:* ${assignedName}\n` : "") +
      (helperName ? `• *Ayudante asignado:* ${helperName}\n` : "") +
      `\nAgradecemos de antemano su valiosa colaboración en el programa.`
    );
  }

  // Tono por defecto: Fraternal
  return (
    `¡Hola, querido/a ${prefix} *${publisherName}*! Esperamos que se encuentre muy bien.\n\n` +
    `Le compartimos los detalles de su asignación para la reunión de la *${weekRangeText}*:\n\n` +
    `📌 *Sección:* ${sectionTitle}\n` +
    `📖 *Parte:* ${partTitle}${durationText}\n` +
    `👤 *Rol:* ${roleLabel}\n` +
    (assignedName ? `👤 *Asignado principal:* ${assignedName}\n` : "") +
    (helperName ? `👥 *Ayudante:* ${helperName}\n` : "") +
    `\nQue Jehová bendiga su preparación para esta parte. ¡Un abrazo fraternal!`
  );
}

type PuterGlobal = {
  ai?: {
    chat?: (
      prompt: string,
      options?: Record<string, unknown>
    ) => Promise<unknown>;
  };
};

export type MonthlyAssignmentEntry = {
  dateLabel: string;
  partTitle: string;
  roleLabel: string;
  sectionTitle?: string;
  durationMinutes?: number | null;
};

export type MonthlySummaryParams = {
  publisherName: string;
  gender: "MALE" | "FEMALE";
  monthLabel: string;
  entries: MonthlyAssignmentEntry[];
};

/**
 * Mensaje resumen mensual: agrupa TODAS las asignaciones del publicador
 * en el mes en un único mensaje de WhatsApp.
 */
export function generateMonthlySummaryMessage(
  params: MonthlySummaryParams
): string {
  const { publisherName, gender, monthLabel, entries } = params;
  const prefix = gender === "MALE" ? "hermano" : "hermana";

  const list = entries
    .map((entry) => {
      const duration =
        entry.durationMinutes != null && entry.durationMinutes > 0
          ? ` (${entry.durationMinutes} min)`
          : "";
      const weekDate = entry.dateLabel.replace(/^[a-záéíóúñ]{3}\s+/i, "");
      const section = entry.sectionTitle
        ? `📚 *Sección:* ${entry.sectionTitle}`
        : "";
      return [
        `📅 *Semana del ${weekDate}*`,
        section,
        `📝 *Tema:* ${entry.partTitle}${duration}`,
        `👤 *Rol:* ${entry.roleLabel}`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return (
    `¡Hola, querido/a ${prefix} *${publisherName}*! Esperamos que se encuentre muy bien.\n\n` +
    `Le compartimos el resumen de sus asignaciones para las reuniones de *${monthLabel}*:\n\n` +
    `${list}\n\n` +
    `Que Jehová bendiga su preparación para cada parte.`
  );
}

/**
 * Generador con IA Grok a través de Puter.js (en el navegador)
 */
export async function generateAiGrokMessage(
  params: AssignmentMessageParams
): Promise<string> {
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
  const durationText = durationMinutes ? `${durationMinutes} minutos` : "no especificada";

  const toneInstructions = {
    FRATERNAL: process.env.NEXT_PUBLIC_WHATSAPP_PROMPT_FRATERNAL,
    FORMAL: process.env.NEXT_PUBLIC_WHATSAPP_PROMPT_FORMAL,
    REMINDER: process.env.NEXT_PUBLIC_WHATSAPP_PROMPT_REMINDER,
  }[tone];

  if (!toneInstructions) {
    throw new Error(`Falta configurar NEXT_PUBLIC_WHATSAPP_PROMPT_${tone} en .env`);
  }

  const prompt = `
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

  try {
    // Verificar si Puter está disponible en el objeto global del navegador
    const puter =
      typeof window !== "undefined"
        ? (window as unknown as { puter?: PuterGlobal }).puter
        : undefined;

    if (puter?.ai?.chat) {
      const response = await puter.ai.chat(prompt, {
        model: "meta-llama/llama-4-maverick",
      });

      const responseObj = response as {
        message?: { content?: string };
        text?: string;
      } | null;

      const messageContent =
        typeof response === "string"
          ? response
          : responseObj?.message?.content || responseObj?.text || "";

      if (messageContent && messageContent.trim().length > 20) {
        return messageContent.trim();
      }
    }
  } catch (error) {
    console.warn("Puter Grok AI no disponible o tardó demasiado, usando plantilla estructurada:", error);
  }

  // Fallback garantizado e instantáneo
  return generateTemplateMessage(params);
}

/**
 * Sanitiza y formatea el enlace a WhatsApp (Web o App)
 */
export function createWhatsAppUrl(phone?: string | null, message = ""): string {
  const encodedText = encodeURIComponent(message.trim());
  if (phone) {
    // Quitar espacios, guiones y caracteres no numéricos
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return `https://wa.me/${cleanPhone}?text=${encodedText}`;
  }
  return `https://wa.me/?text=${encodedText}`;
}
