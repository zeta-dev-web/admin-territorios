"use client";

import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopilotChat } from "@/components/ai/use-copilot-chat";

const QUICK_SUGGESTIONS = [
  "¿Qué territorios están disponibles?",
  "Dame estadísticas de territorios",
  "¿Cuál es el estado del territorio 15?",
];

export function CopilotTerritoriosChat() {
  const {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    isLoading,
    status,
    sendMessage,
    messagesEndRef,
  } = useCopilotChat("territorios");

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#DC2626] to-[#B91C1C] text-[#ffffff] shadow-xl transition-transform hover:scale-105 active:scale-95"
          title="Abrir Copiloto IA de Territorios"
        >
          <Sparkles className="h-6 w-6" />
          <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60"></span>
            <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-red-500 border-2 border-white"></span>
          </span>
        </button>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[520px] max-h-[85vh] w-[92vw] max-w-[380px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl">
          {/* Encabezado */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[#DC2626] to-[#B91C1C] px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Copiloto Territorios</p>
                <p className="text-[11px] text-white/70">
                  Sistema de IA · conectado a tu congregación
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              title="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 space-y-3 overflow-y-auto bg-[#F8F9FA] px-3 py-4">
            {messages.length === 0 && (
              <div className="space-y-3 px-1">
                <div className="rounded-2xl rounded-tl-sm border border-[#E2E8F0] bg-white p-3 text-sm text-[#4A5568]">
                  ¡Hola! Soy tu copiloto de territorios. Puedo consultarte historial de
                  territorios, asignaciones, publicadores y estadísticas de la
                  congregación. ¿En qué te ayudo?
                </div>
                <div className="space-y-1.5 pt-1">
                  {QUICK_SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => void sendMessage(suggestion)}
                      className="w-full rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-left text-xs text-[#DC2626] transition-colors hover:border-[#DC2626] hover:bg-red-50"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-[#DC2626] text-white"
                      : "rounded-tl-sm border border-[#E2E8F0] bg-white text-[#2D3748]"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-[#E2E8F0] bg-white px-3.5 py-2.5 text-xs text-[#718096]">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#DC2626]" />
                  {status ?? "Pensando..."}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Entrada de texto */}
          <div className="flex items-center gap-2 border-t border-[#E2E8F0] bg-white px-3 py-3">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu consulta..."
              disabled={isLoading}
              className="h-9 flex-1 rounded-full border border-[#E2E8F0] bg-[#F8F9FA] px-4 text-sm text-[#2D3748] placeholder:text-[#A0AEC0] focus:border-[#DC2626] focus:outline-none disabled:opacity-60"
            />
            <Button
              type="button"
              onClick={() => void sendMessage()}
              disabled={isLoading || !input.trim()}
              size="icon"
              className="h-9 w-9 shrink-0 rounded-full bg-[#DC2626] hover:bg-[#B91C1C]"
              title="Enviar"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
