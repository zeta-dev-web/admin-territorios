"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MessageCircle,
  Sparkles,
  Send,
  Loader2,
  Phone,
  Copy,
  Check,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  generateAiGrokMessage,
  generateTemplateMessage,
  createWhatsAppUrl,
  MessageTone,
} from "@/lib/ai/whatsapp-ai";
import type { WhatsAppShareData } from "./whatsapp-share-data";

export type { WhatsAppShareData } from './whatsapp-share-data'

interface WhatsAppShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: WhatsAppShareData | null;
  onPhoneUpdated?: (publisherId: string, newPhone: string) => void;
}

export function WhatsAppShareDialog({
  isOpen,
  onClose,
  data,
  onPhoneUpdated,
}: WhatsAppShareDialogProps) {
  const [tone, setTone] = useState<MessageTone>("FRATERNAL");
  const [message, setMessage] = useState("");
  const [phone, setPhone] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [copied, setCopied] = useState(false);
  const [directMode, setDirectMode] = useState(false);
  const [isSendingDirect, setIsSendingDirect] = useState(false);

  // Inicializar estado cuando se abre con nuevos datos (reset intencional del diálogo)
  useEffect(() => {
    if (data && isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPhone(data.phone || "");
      const initialMsg = generateTemplateMessage({
        ...data,
        tone: "FRATERNAL",
      });
      setMessage(initialMsg);
      setTone("FRATERNAL");

      // Detectar si hay sesión activa de Evolution API para envío directo
      const checkDirectMode = async () => {
        try {
          const res = await fetch("/api/whatsapp/connection");
          if (!res.ok) return;
          const conn = await res.json();
          if (conn.state === "open") {
            setDirectMode(true);
            return;
          }
        } catch {
          // Sin Evolution API disponible
        }
        setDirectMode(false);
      };
      void checkDirectMode();
    }
  }, [data, isOpen]);

  if (!data) return null;

  // Generar mensaje con IA Grok
  const handleGenerateAiMessage = async (selectedTone: MessageTone = tone) => {
    setIsGenerating(true);
    try {
      const aiText = await generateAiGrokMessage({
        ...data,
        tone: selectedTone,
      });
      setMessage(aiText);
      toast.success("Mensaje redactado con IA");
    } catch (error) {
      const reason = error instanceof Error ? error.message : "error desconocido";
      toast.error(`IA no disponible (${reason}). Usando plantilla estándar`, {
        duration: 5000,
      });
      setMessage(generateTemplateMessage({ ...data, tone: selectedTone }));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToneChange = (newTone: MessageTone) => {
    setTone(newTone);
    handleGenerateAiMessage(newTone);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("Mensaje copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  // Guardar teléfono en el perfil del publicador si fue modificado
  const handleSavePhone = async () => {
    if (!data.publisherId || !phone.trim()) return;
    setIsSavingPhone(true);
    try {
      const res = await fetch(`/api/vymc/publishers/${data.publisherId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      });
      if (res.ok) {
        toast.success("Teléfono guardado en el perfil");
        onPhoneUpdated?.(data.publisherId, phone.trim());
      }
    } catch {
      // Ignorar fallo de guardado secundario
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handleSendDirect = async () => {
    if (!phone.trim()) {
      toast.error("Cargá un número de teléfono para el envío directo");
      return;
    }
    setIsSendingDirect(true);
    try {
      if (phone && phone !== data.phone && data.publisherId) {
        await handleSavePhone();
      }
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          message,
          recipientLabel: `${data.publisherName} (${data.roleLabel})`,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al encolar el mensaje");
      toast.success("Mensaje en cola. Se enviará con pausa antiban 🛡️");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al enviar");
    } finally {
      setIsSendingDirect(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (phone && phone !== data.phone && data.publisherId) {
      await handleSavePhone();
    }
    const url = createWhatsAppUrl(phone, message);
    window.open(url, "_blank");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-card-foreground">
                Notificar por WhatsApp
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {data.publisherName} • {data.roleLabel} ({data.partTitle})
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Teléfono del destinatario */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="wa-phone" className="text-xs font-medium text-foreground flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-600" />
                Número de WhatsApp:
              </Label>
              {data.publisherId && phone !== data.phone && (
                <button
                  type="button"
                  onClick={handleSavePhone}
                  disabled={isSavingPhone}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  {isSavingPhone ? "Guardando..." : "Guardar en directorio"}
                </button>
              )}
            </div>
            <Input
              id="wa-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Ej: +54 9 381 123-4567"
              className="border-border focus:border-emerald-500 focus:ring-emerald-500 text-sm"
            />
            {!phone && !directMode && (
              <p className="text-[11px] text-amber-600 font-medium">
                ⚠️ Sin teléfono: Al enviar, se abrirá WhatsApp para elegir el contacto.
              </p>
            )}
            {directMode && (
              <p className="text-[11px] text-emerald-600 font-medium">
                🟢 Envío directo activo (Evolution API conectada)
              </p>
            )}
          </div>

          {/* Opciones de Tono y Botón de IA */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-border">
            <div className="flex items-center gap-2 flex-1">
              <Label className="text-xs font-medium text-foreground/80 whitespace-nowrap">
                Estilo de redacción:
              </Label>
              <Select value={tone} onValueChange={(val) => handleToneChange(val as MessageTone)}>
                <SelectTrigger className="h-8 text-xs border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FRATERNAL">Cercano y fraternal</SelectItem>
                  <SelectItem value="FORMAL">Formal y conciso</SelectItem>
                  <SelectItem value="REMINDER">Recordatorio semanal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleGenerateAiMessage(tone)}
              disabled={isGenerating}
              className="h-8 gap-1.5 border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 hover:text-purple-800 text-xs font-medium"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Redactando...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                  Reescribir con IA
                </>
              )}
            </Button>
          </div>

          {/* Área de texto del mensaje */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="wa-message" className="text-xs font-medium text-foreground">
                Vista previa del mensaje (editable):
              </Label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
            <textarea
              id="wa-message"
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full rounded-lg border border-border p-3 text-sm leading-relaxed text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-[#FAFAFA]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="border-border"
          >
            Cancelar
          </Button>
          {directMode ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleSendWhatsApp}
                disabled={isSendingDirect}
                className="border-border text-muted-foreground"
                title="Abrir en WhatsApp Web/App"
              >
                <Send className="w-4 h-4" />
                wa.me
              </Button>
              <Button
                type="button"
                onClick={() => void handleSendDirect()}
                disabled={isSendingDirect || !phone.trim()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
              >
                {isSendingDirect ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Enviar directo
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleSendWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar por WhatsApp
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
