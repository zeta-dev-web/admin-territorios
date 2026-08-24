import { getConnectionState, sendText } from "@/lib/whatsapp/evolution-client";

/**
 * Cola de despacho de WhatsApp con estrategia antiban:
 * Por cada mensaje: se dispara la señal "escribiendo..." y, luego de un
 * lapso aleatorio de 15 a 20 segundos, recién sale el mensaje.
 * El procesamiento es secuencial (nunca ráfagas).
 *
 * Nota: la cola vive en memoria del proceso de Node (suficiente para uso
 * administrativo local). Los estados son: QUEUED → SENDING → SENT | FAILED.
 */

export type QueueItemStatus = "QUEUED" | "SENDING" | "SENT" | "FAILED";

export type QueueItem = {
  id: string;
  phone: string;
  recipientLabel?: string;
  message: string;
  status: QueueItemStatus;
  error?: string;
  createdAt: Date;
  sentAt?: Date;
};

type QueueState = {
  items: Map<string, QueueItem>;
  isProcessing: boolean;
};

const globalForQueue = globalThis as unknown as {
  __vymcWhatsappQueue?: QueueState;
};

function getState(): QueueState {
  if (!globalForQueue.__vymcWhatsappQueue) {
    globalForQueue.__vymcWhatsappQueue = {
      items: new Map(),
      isProcessing: false,
    };
  }
  return globalForQueue.__vymcWhatsappQueue;
}

const MIN_SEND_DELAY_MS = 15000;
const MAX_SEND_DELAY_MS = 20000;
const MAX_QUEUE_ITEMS = 200;

function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min));
}

export function enqueueMessage(params: {
  phone: string;
  message: string;
  recipientLabel?: string;
}): QueueItem {
  const state = getState();

  if (state.items.size >= MAX_QUEUE_ITEMS) {
    // Purga los completados más viejos para no crecer sin límite
    for (const [id, item] of [...state.items.entries()].reverse()) {
      if (item.status === "SENT" || item.status === "FAILED") {
        state.items.delete(id);
        if (state.items.size < MAX_QUEUE_ITEMS) break;
      }
    }
  }

  const item: QueueItem = {
    id: `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    phone: params.phone,
    recipientLabel: params.recipientLabel,
    message: params.message,
    status: "QUEUED",
    createdAt: new Date(),
  };

  state.items.set(item.id, item);
  void ensureProcessing();
  return item;
}

export function getQueueSnapshot(): QueueItem[] {
  return [...getState().items.values()].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );
}

export function clearFinishedFromQueue(): number {
  const state = getState();
  let removed = 0;
  for (const [id, item] of state.items.entries()) {
    if (item.status === "SENT" || item.status === "FAILED") {
      state.items.delete(id);
      removed++;
    }
  }
  return removed;
}

async function ensureProcessing(): Promise<void> {
  const state = getState();
  if (state.isProcessing) return;

  state.isProcessing = true;
  try {
    while (true) {
      const next = [...state.items.values()]
        .filter((item) => item.status === "QUEUED")
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];

      if (!next) break;

      // Verificar conexión antes de intentar
      const connection = await getConnectionState().catch(() => null);
      if (!connection?.configured) {
        next.status = "FAILED";
        next.error = "Evolution API no configurada (.env)";
        continue;
      }

      next.status = "SENDING";
      try {
        // 🛡️ Antiban: Evolution dispara "escribiendo..." y espera un lapso
        // aleatorio de 15-20s antes de enviar el mensaje real.
        const sendDelayMs = randomInt(MIN_SEND_DELAY_MS, MAX_SEND_DELAY_MS);
        await sendText(next.phone, next.message, sendDelayMs);
        next.status = "SENT";
        next.sentAt = new Date();
        delete next.error;
      } catch (error) {
        next.status = "FAILED";
        next.error =
          error instanceof Error ? error.message : "Error desconocido al enviar";
      }
    }
  } finally {
    state.isProcessing = false;
  }
}
