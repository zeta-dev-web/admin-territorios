import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from '@/lib/auth'
import {
  connectInstance,
  getConnectionState,
  logoutInstance,
} from "@/lib/whatsapp/evolution-client";

/**
 * Gestión de la conexión de WhatsApp (Evolution API local).
 * GET  → estado de conexión (+QR si se está vinculando)
 * POST → { action: "connect" } genera QR | { action: "disconnect" } cierra sesión
 */

const connectionActionSchema = z.object({
  action: z.enum(["connect", "disconnect"]),
});

// GET /api/whatsapp/connection
export async function GET() {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const connection = await getConnectionState();

    // Si está conectando, intentar obtener el QR vigente
    if (connection.state === "connecting") {
      try {
        const connectResult = await connectInstance();
        return NextResponse.json({
          ...connection,
          qrBase64: connectResult.qrBase64,
          pairingCode: connectResult.pairingCode,
        });
      } catch {
        return NextResponse.json(connection);
      }
    }

    return NextResponse.json({
      configured: connection.configured,
      state: connection.state,
      qrBase64: null,
      pairingCode: null,
    });
  } catch (error) {
    console.error("Error consultando conexión de WhatsApp:", error);
    return NextResponse.json(
      { error: "Error al consultar la conexión de WhatsApp" },
      { status: 500 }
    );
  }
}

// POST /api/whatsapp/connection
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = connectionActionSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 });
    }

    if (validationResult.data.action === "disconnect") {
      await logoutInstance();
      return NextResponse.json({ state: "close", qrBase64: null });
    }

    const result = await connectInstance();
    return NextResponse.json({
      state: result.state,
      qrBase64: result.qrBase64,
      pairingCode: result.pairingCode,
    });
  } catch (error) {
    console.error("Error gestionando conexión de WhatsApp:", error);
    const message =
      error instanceof Error ? error.message : "Error inesperado";
    return NextResponse.json(
      { error: `No se pudo conectar con Evolution API. ${message}`.slice(0, 300) },
      { status: 502 }
    );
  }
}
