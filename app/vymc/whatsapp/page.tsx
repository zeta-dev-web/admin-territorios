"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Loader2,
  MessageCircle,
  QrCode,
  RefreshCw,
  Trash2,
  Unplug,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type ConnectionState = "open" | "connecting" | "close" | "unconfigured";

type QueueEntry = {
  id: string;
  phone: string;
  recipientLabel: string | null;
  preview: string;
  status: "QUEUED" | "SENDING" | "SENT" | "FAILED";
  error: string | null;
  createdAt: string;
  sentAt: string | null;
};

const STATE_META: Record<ConnectionState, { label: string; className: string }> = {
  open: { label: "Conectado", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  connecting: { label: "Esperando escaneo del QR", className: "bg-amber-100 text-amber-700 border-amber-200" },
  close: { label: "Desconectado", className: "bg-red-100 text-red-700 border-red-200" },
  unconfigured: { label: "Evolution API no configurada", className: "bg-gray-100 text-gray-600 border-gray-200" },
};

const STATUS_META: Record<QueueEntry["status"], { label: string; className: string }> = {
  QUEUED: { label: "En cola", className: "bg-blue-100 text-blue-700" },
  SENDING: { label: "Enviando...", className: "bg-amber-100 text-amber-700" },
  SENT: { label: "Enviado", className: "bg-emerald-100 text-emerald-700" },
  FAILED: { label: "Fallido", className: "bg-red-100 text-red-700" },
};

export default function WhatsappPage() {
  const [state, setState] = useState<ConnectionState>("close");
  const [configured, setConfigured] = useState(true);
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [queueItems, setQueueItems] = useState<QueueEntry[]>([]);
  const cancelledRef = useRef(false);

  const refreshConnection = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/connection");
      if (!res.ok) return false;
      const data = await res.json();
      if (cancelledRef.current) return false;
      setConfigured(Boolean(data.configured));
      setState(data.state ?? "close");
      setQrBase64(data.qrBase64 ?? null);
      return true;
    } catch {
      // Silencioso: el panel reintenta por polling
      return false;
    }
  }, []);

  const refreshQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/queue");
      if (!res.ok) return;
      const data = await res.json();
      if (cancelledRef.current) return;
      setQueueItems(data.items ?? []);
    } catch {
      // Silencioso
    }
  }, []);

  useEffect(() => {
    cancelledRef.current = false;

    const tick = async () => {
      await Promise.all([refreshConnection(), refreshQueue()]);
    };

    void tick();
    const interval = setInterval(() => {
      void tick();
    }, 3000);

    return () => {
      cancelledRef.current = true;
      clearInterval(interval);
    };
  }, [refreshConnection, refreshQueue]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const res = await fetch("/api/whatsapp/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar la conexión");
      setState(data.state ?? "connecting");
      setQrBase64(data.qrBase64 ?? null);
      toast.success("Escanea el código QR con WhatsApp");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al conectar");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleVerify = async () => {
    setIsRefreshing(true);
    const refreshed = await refreshConnection();
    setIsRefreshing(false);
    if (refreshed) {
      toast.success("Estado de conexión actualizado");
    } else {
      toast.error("No se pudo verificar la conexión");
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm("¿Cerrar la sesión de WhatsApp vinculada? Tendrás que escanear el QR nuevamente.")) return;
    try {
      await fetch("/api/whatsapp/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      setQrBase64(null);
      await refreshConnection();
      toast.success("Sesión cerrada");
    } catch {
      toast.error("Error al cerrar la sesión");
    }
  };

  const handleClearFinished = async () => {
    try {
      await fetch("/api/whatsapp/queue", { method: "DELETE" });
      await refreshQueue();
    } catch {
      toast.error("Error al limpiar la cola");
    }
  };

  const qrSrc =
    qrBase64 &&
    (qrBase64.startsWith("data:image") ? qrBase64 : `data:image/png;base64,${qrBase64}`);

  const hasPending = queueItems.some(
    (item) => item.status === "QUEUED" || item.status === "SENDING"
  );
  const stateMeta = STATE_META[state];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-xl font-semibold text-card-foreground">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Envío directo de notificaciones mediante Evolution API con protección antiban
          (escribiendo... + pausa aleatoria de 15-20 segundos por mensaje).
        </p>
      </div>

      {/* Conexión */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-card-foreground">Conexión</CardTitle>
                <CardDescription className="text-xs">
                  Instancia local de Evolution API (Baileys)
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className={stateMeta.className}>
              {stateMeta.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!configured && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Faltan las variables <code>EVOLUTION_API_URL</code>,{" "}
              <code>EVOLUTION_API_KEY</code> y <code>EVOLUTION_INSTANCE_NAME</code>{" "}
              en el archivo .env. Levanta el contenedor con{" "}
              <code>docker compose up -d</code>.
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {state !== "open" && (
              <Button
                onClick={() => void handleConnect()}
                disabled={isConnecting || !configured}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isConnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <QrCode className="h-4 w-4" />
                )}
                Vincular WhatsApp (QR)
              </Button>
            )}
            {state === "open" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => void handleVerify()}
                  disabled={isRefreshing}
                  className="gap-1.5 border-border"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Verificando..." : "Verificar"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleDisconnect()}
                  className="gap-1.5 border-red-200 text-red-600 hover:bg-destructive/10 hover:text-red-700"
                >
                  <Unplug className="h-3.5 w-3.5" />
                  Cerrar sesión
                </Button>
              </>
            )}
          </div>

          {/* QR de vinculación */}
          {(state === "connecting" || qrSrc) && (
            <div className="rounded-lg border border-border bg-card p-4 flex flex-col items-center gap-3">
              {qrSrc ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrSrc} alt="Código QR de WhatsApp" className="h-56 w-56 rounded-lg" />
                  <p className="text-xs text-muted-foreground text-center max-w-xs">
                    Abre WhatsApp en el teléfono del grupo →{" "}
                    <strong>Dispositivos vinculados</strong> → <strong>Vincular dispositivo</strong>{" "}
                    y escanea este código.
                  </p>
                </>
              ) : (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generando código QR...
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cola de envíos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base text-card-foreground">Cola de envíos</CardTitle>
              <CardDescription className="text-xs">
                Pausa antiban: señal de “escribiendo...” + 15-20 segundos aleatorios antes de cada mensaje
                {hasPending && " · actualizando..."}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleClearFinished()}
              disabled={!queueItems.length}
              className="gap-1.5 border-border"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Limpiar completados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {queueItems.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground/70 italic">
              No hay envíos todavía. Usa el botón de WhatsApp en una asignación.
            </p>
          ) : (
            <div className="space-y-1.5">
              {queueItems.map((item) => {
                const meta = STATUS_META[item.status];
                return (
                  <div
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {item.recipientLabel ?? item.phone}
                        {item.recipientLabel && (
                          <span className="ml-2 text-xs font-normal text-muted-foreground/70">
                            {item.phone}
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground/70">{item.preview}</p>
                      {item.error && (
                        <p className="mt-0.5 truncate text-[11px] text-red-500" title={item.error}>
                          {item.error}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] font-medium ${meta.className}`}
                    >
                      {item.status === "SENT" && <CheckCircle2 className="h-3 w-3" />}
                      {item.status === "FAILED" && <XCircle className="h-3 w-3" />}
                      {(item.status === "QUEUED" || item.status === "SENDING") && (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      )}
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
