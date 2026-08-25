/**
 * Plantillas de mensajes de WhatsApp para el Sistema VYMC.
 * La redacción con IA vive en el endpoint /api/ai/whatsapp-message (OpenRouter)
 * y usa estas plantillas como respaldo.
 */

export type MessageTone = "FRATERNAL" | "FORMAL" | "REMINDER";

export type AssignmentMessageParams = {
  publisherName: string;
  gender: "MALE" | "FEMALE";
  role?: string;
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
