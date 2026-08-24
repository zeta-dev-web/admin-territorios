"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageCircle,
  Phone,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type BulkRecipient = {
  publisherId: string;
  fullName: string;
  phone: string | null;
  gender: string;
  assignmentsCount: number;
  message: string;
};

type BulkPreview = {
  monthLabel: string;
  weeksCount: number;
  recipients: BulkRecipient[];
  stats: { total: number; withPhone: number; withoutPhone: number };
};

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

type BulkSendDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  years: number[];
};

export function BulkSendDialog({ open, onOpenChange, years }: BulkSendDialogProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [preview, setPreview] = useState<BulkPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [whatsappConnected, setWhatsappConnected] = useState<boolean | null>(null);

  const yearOptions = useMemo(() => {
    const uniqueYears = new Set<number>(years);
    uniqueYears.add(now.getFullYear());
    return [...uniqueYears].sort((a, b) => b - a);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [years]);

  async function loadPreview(targetMonth: number, targetYear: number) {
    setIsLoadingPreview(true);
    try {
      const res = await fetch(`/api/whatsapp/bulk?month=${targetMonth}&year=${targetYear}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al generar la vista previa");
      setPreview(data);
      setSelected(
        new Set(
          (data.recipients as BulkRecipient[])
            .filter((recipient) => recipient.phone)
            .map((recipient) => recipient.publisherId)
        )
      );
      setExpandedId(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error inesperado");
      setPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }

  useEffect(() => {
    if (!open) return;

    const initialize = async () => {
      await Promise.all([
        loadPreview(month, year),
        (async () => {
          try {
            const res = await fetch("/api/whatsapp/connection");
            const conn = await res.json();
            setWhatsappConnected(res.ok && conn.state === "open");
          } catch {
            setWhatsappConnected(false);
          }
        })(),
      ]);
    };

    void initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
    void loadPreview(newMonth, year);
  };

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
    void loadPreview(month, newYear);
  };

  const toggleRecipient = (publisherId: string) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(publisherId)) next.delete(publisherId);
      else next.add(publisherId);
      return next;
    });
  };

  const selectedWithPhone = useMemo(() => {
    if (!preview) return 0;
    return preview.recipients.filter(
      (recipient) => selected.has(recipient.publisherId) && recipient.phone
    ).length;
  }, [preview, selected]);

  const handleSend = () => {
    if (!preview || selectedWithPhone === 0) return;
    setShowSendConfirm(true);
  };

  const confirmSend = async () => {
    setShowSendConfirm(false);
    setIsSending(true);
    try {
      const res = await fetch("/api/whatsapp/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          year,
          publisherIds: [...selected],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al encolar");

      toast.success(
        `${data.queued} mensajes en cola. Se enviarán de a uno, con pausa antiban 🛡️`
      );
      for (const skip of data.skipped ?? []) {
        toast.error(`${skip.fullName}: ${skip.reason}`);
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-card-foreground">
                Enviar asignaciones del mes
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Un mensaje por publicador con todas sus asignaciones agrupadas
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Selector de mes/año */}
        <div className="flex flex-wrap items-center gap-2 py-1">
          <select
            value={month}
            onChange={(event) => handleMonthChange(Number(event.target.value))}
            className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {MONTH_NAMES.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(event) => handleYearChange(Number(event.target.value))}
            className="h-9 rounded-md border border-border bg-card px-3 text-sm text-foreground/80 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          >
            {yearOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>

          {preview && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {preview.stats.total} destinatario(s) · {preview.weeksCount} semana(s)
            </span>
          )}
        </div>

        {/* Aviso de conexión */}
        {whatsappConnected === false && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            WhatsApp no está conectado. Vinculá la sesión desde el panel{" "}
            <a href="/vymc/whatsapp" className="font-semibold underline">
              WhatsApp
            </a>{" "}
            antes de enviar.
          </div>
        )}

        {/* Lista de destinatarios */}
        <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
          {isLoadingPreview ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Generando vista previa...
            </div>
          ) : !preview || preview.recipients.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground/70 italic">
              No hay asignaciones cargadas para este mes.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {preview.recipients.map((recipient) => {
                const hasPhone = !!recipient.phone;
                const isSelected = selected.has(recipient.publisherId);
                const isExpanded = expandedId === recipient.publisherId;
                return (
                  <div key={recipient.publisherId} className="px-3 py-2">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRecipient(recipient.publisherId)}
                        disabled={!hasPhone}
                        className="h-4 w-4 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : recipient.publisherId)
                        }
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                        )}
                        <span className="truncate text-sm font-medium text-foreground">
                          {recipient.fullName}
                        </span>
                        {hasPhone ? (
                          <Badge variant="outline" className="shrink-0 gap-1 border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700">
                            <Phone className="h-2.5 w-2.5" />
                            {recipient.phone}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="shrink-0 border-red-200 bg-red-50 text-[11px] text-red-600">
                            sin teléfono
                          </Badge>
                        )}
                        <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                          {recipient.assignmentsCount} asignacion{recipient.assignmentsCount === 1 ? "" : "es"}
                        </span>
                      </button>
                    </div>

                    {isExpanded && (
                      <pre className="mt-2 ml-7 whitespace-pre-wrap rounded-lg border border-border bg-muted/50 p-3 font-sans text-xs leading-relaxed text-foreground">
                        {recipient.message}
                      </pre>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border">
            Cancelar
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || isLoadingPreview || selectedWithPhone === 0}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Encolando...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4" />
                Encolar {selectedWithPhone} mensaje{selectedWithPhone === 1 ? "" : "s"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>

      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-card-foreground">Confirmar envío</DialogTitle>
                <DialogDescription className="text-xs">
                  Se preparará el envío de los mensajes seleccionados.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
            Se agregará a la cola de envío: <strong>{selectedWithPhone} mensaje{selectedWithPhone === 1 ? "" : "s"}</strong>.
          </p>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSendConfirm(false)}
              disabled={isSending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => void confirmSend()}
              disabled={isSending}
              className="gap-2 bg-emerald-600 font-medium text-white hover:bg-emerald-700"
            >
              {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
              Confirmar envío
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
