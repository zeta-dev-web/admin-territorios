import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from '@/lib/auth'
import { normalizePhone } from "@/lib/whatsapp/evolution-client";
import {
  enqueueMessage,
  getQueueSnapshot,
} from "@/lib/whatsapp/queue";

/**
 * Envío de mensajes por WhatsApp con cola antiban.
 * POST → encola un mensaje (sale tras "escribiendo..." + 15-20s aleatorios).
 */

const sendSchema = z.object({
  phone: z.string().min(6).max(30),
  message: z.string().min(1).max(4000),
  recipientLabel: z.string().max(120).optional(),
});

// POST /api/whatsapp/send
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = sendSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { phone, message, recipientLabel } = validationResult.data;
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return NextResponse.json(
        { error: `El número "${phone}" no parece válido (incluye código de país, ej: 549381234567)` },
        { status: 422 }
      );
    }

    const item = enqueueMessage({ phone: normalized, message, recipientLabel });

    return NextResponse.json(
      {
        queued: true,
        id: item.id,
        status: item.status,
        queuePosition: getQueueSnapshot().filter((i) => i.status === "QUEUED").length,
      },
      { status: 202 }
    );
  } catch (error) {
    console.error("Error encolando mensaje de WhatsApp:", error);
    return NextResponse.json(
      { error: "Error al encolar el mensaje" },
      { status: 500 }
    );
  }
}
