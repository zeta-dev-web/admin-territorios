"use client";

import { useEffect, useRef, useState } from "react";

export type CopilotChatModule = "vymc" | "territorios";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function useCopilotChat(module: CopilotChatModule) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) return;
    const timer = setTimeout(() => {
      setStatus("Analizando resultados...");
    }, 5000);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const sendMessage = async (rawText?: string) => {
    const text = (rawText ?? input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = { role: "user", content: text };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setStatus(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          module,
          messages: updatedMessages.slice(-MAX_SENT_MESSAGES),
        }),
      });

      const data = await res.json().catch(() => ({}));

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            (res.ok ? data.reply : undefined) ||
            data.error ||
            "Ocurrió un error al consultar la IA. Verificá tu conexión e inténtalo de nuevo.",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "No se pudo contactar el servidor. Verificá tu conexión e inténtalo de nuevo.",
        },
      ]);
    } finally {
      setIsLoading(false);
      setStatus(null);
    }
  };

  return {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    isLoading,
    status,
    sendMessage,
    messagesEndRef,
  };
}

const MAX_SENT_MESSAGES = 20;
