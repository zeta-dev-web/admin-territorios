/**
 * Cliente HTTP para la API no oficial de WhatsApp "Evolution API v2"
 * (basada en Baileys). Corre localmente vía docker-compose.yml.
 *
 * Configuración requerida en .env:
 *   EVOLUTION_API_URL      → http://localhost:8080
 *   EVOLUTION_API_KEY      → igual a AUTHENTICATION_API_KEY del contenedor
 *   EVOLUTION_INSTANCE_NAME→ nombre de la instancia (ej: vymc)
 */

export type EvolutionConnectionState = "open" | "connecting" | "close";

export type EvolutionConnectResult = {
  state: EvolutionConnectionState;
  qrBase64?: string | null;
  pairingCode?: string | null;
  raw: unknown;
};

function getConfig() {
  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME;

  if (!baseUrl || !apiKey || !instanceName) {
    throw new Error(
      "Evolution API no configurada: faltan EVOLUTION_API_URL, EVOLUTION_API_KEY o EVOLUTION_INSTANCE_NAME en .env"
    );
  }

  return { baseUrl: baseUrl.replace(/\/+$/, ""), apiKey, instanceName };
}

async function evolutionFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const { baseUrl, apiKey } = getConfig();

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: apiKey,
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let detail = "";
    try {
      detail = JSON.stringify(await response.json());
    } catch {
      detail = await response.text().catch(() => "");
    }
    throw new Error(`Evolution API (${path}): ${response.status} ${detail}`.slice(0, 400));
  }

  return (await response.json()) as T;
}

/**
 * Normaliza un número al formato internacional sin símbolos (ej: 549381234567).
 */
export function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/[^0-9]/g, "");
  // Números argentinos que empiezan con 0 o 15: recortar prefijos locales comunes
  let normalized = digits;
  if (normalized.startsWith("00")) normalized = normalized.slice(2);
  if (normalized.length > 10 && normalized.startsWith("0")) {
    normalized = normalized.slice(1);
  }
  return normalized.length >= 10 && normalized.length <= 15 ? normalized : null;
}

/** Estado de conexión de la instancia. */
export async function getConnectionState(): Promise<{
  configured: boolean;
  state: EvolutionConnectionState | "unconfigured";
}> {
  try {
    const { instanceName } = getConfig();
    const data = await evolutionFetch<{ instance?: { state?: string } }>(
      `/instance/connectionState/${instanceName}`
    );
    const state = data.instance?.state ?? "close";
    return {
      configured: true,
      state:
        state === "open" || state === "connecting" ? state : "close",
    };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("no configurada")
    ) {
      return { configured: false, state: "unconfigured" };
    }
    // Instancia inexistente aún = cerrada
    return { configured: true, state: "close" };
  }
}

/**
 * Crea la instancia si no existe y devuelve el QR para vincular WhatsApp,
 * o el estado actual si ya está conectada.
 */
export async function connectInstance(): Promise<EvolutionConnectResult> {
  const { instanceName, apiKey } = getConfig();

  type ConnectionResponse = {
    state?: string;
    instance?: { state?: string };
    base64?: string;
    code?: string;
    pairingCode?: string;
    qrcode?: {
      base64?: string;
      code?: string;
      pairingCode?: string;
    };
  };

  const parseConnectionResponse = (data: ConnectionResponse): EvolutionConnectResult => {
    const qrBase64 = data.base64 ?? data.qrcode?.base64 ?? null;
    const pairingCode = data.pairingCode ?? data.code ?? data.qrcode?.pairingCode ?? data.qrcode?.code ?? null;
    const state = data.state ?? data.instance?.state ?? (qrBase64 ? "connecting" : "open");

    return {
      state: state === "open" || state === "connecting" ? state : "close",
      qrBase64,
      pairingCode,
      raw: data,
    };
  };

  try {
    return parseConnectionResponse(
      await evolutionFetch<ConnectionResponse>(`/instance/connect/${instanceName}`)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const instanceMissing = message.includes("404") && message.toLowerCase().includes("does not exist");
    const instanceAlreadyExists = message.includes("403") || message.toLowerCase().includes("already exists");

    if (instanceMissing) {
      // Evolution API actual requiere crear la instancia antes de solicitar el QR.
      const created = await evolutionFetch<ConnectionResponse>("/instance/create", {
        method: "POST",
        body: JSON.stringify({
          instanceName,
          token: apiKey,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
        }),
      });
      return parseConnectionResponse(created);
    }

    if (instanceAlreadyExists) {
      // La instancia existe: solicitar nuevamente el QR o su estado actual.
      try {
        return parseConnectionResponse(
          await evolutionFetch<ConnectionResponse>(`/instance/connect/${instanceName}`)
        );
      } catch {
        // Si tampoco funciona, devolver estado actual
        const currentState = await getConnectionState();
        return { state: currentState.state === "unconfigured" ? "close" : currentState.state, raw: error };
      }
    }
    throw error;
  }
}

/** Cierra la sesión de WhatsApp (el teléfono deja de estar vinculado). */
export async function logoutInstance(): Promise<void> {
  const { instanceName } = getConfig();
  try {
    await evolutionFetch(`/instance/logout/${instanceName}`, {
      method: "DELETE",
    });
  } catch (error) {
    // Si la instancia ni existe, consideramos el logout exitoso
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("404")) throw error;
  }
}

/** Envía un mensaje de texto. `delayMs` simula presencia humana (escribiendo...). */
export async function sendText(
  phone: string,
  message: string,
  delayMs = 2500
): Promise<{ messageId?: string }> {
  const { instanceName } = getConfig();
  const normalized = normalizePhone(phone);

  if (!normalized) {
    throw new Error(`Número inválido: "${phone}"`);
  }

  const data = await evolutionFetch<{
    key?: { id?: string };
    message?: { key?: { id?: string } };
  }>(`/message/sendText/${instanceName}`, {
    method: "POST",
    body: JSON.stringify({
      number: normalized,
      text: message,
      delay: delayMs,
      linkPreview: false,
    }),
  });

  return { messageId: data.key?.id ?? data.message?.key?.id };
}
