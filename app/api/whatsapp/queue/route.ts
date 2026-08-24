import { NextResponse } from "next/server";
import { getSession } from '@/lib/auth';
import {
  clearFinishedFromQueue,
  getQueueSnapshot,
} from "@/lib/whatsapp/queue";

/**
 * Cola de envíos de WhatsApp.
 * GET    → snapshot con estados (QUEUED | SENDING | SENT | FAILED)
 * DELETE → limpia los envíos ya completados/fallidos
 */

// GET /api/whatsapp/queue
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const items = getQueueSnapshot().map((item) => ({
      id: item.id,
      phone: item.phone,
      recipientLabel: item.recipientLabel ?? null,
      preview: item.message.slice(0, 140),
      status: item.status,
      error: item.error ?? null,
      createdAt: item.createdAt.toISOString(),
      sentAt: item.sentAt?.toISOString() ?? null,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error consultando cola de WhatsApp:", error);
    return NextResponse.json(
      { error: "Error al consultar la cola" },
      { status: 500 }
    );
  }
}

// DELETE /api/whatsapp/queue
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const removed = clearFinishedFromQueue();
    return NextResponse.json({ removed });
  } catch (error) {
    console.error("Error limpiando cola de WhatsApp:", error);
    return NextResponse.json(
      { error: "Error al limpiar la cola" },
      { status: 500 }
    );
  }
}
