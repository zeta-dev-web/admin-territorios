const REQUEST_TIMEOUT_MS = 30_000;
const TOTAL_DEADLINE_MS = 90_000;
const FAILURE_SKIP_MS = 15 * 60 * 1000;

export type ChatRole = "system" | "user" | "assistant" | "tool";

export type ChatMessage = {
  role: ChatRole;
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
};

export type ToolDefinition = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type AssistantToolCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type CompletionResult = {
  content: string;
  toolCalls: AssistantToolCall[];
  model: string;
  provider: string;
};

type ProviderChainEntry = {
  provider: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  extraHeaders?: Record<string, string>;
};

const failedUntil = new Map<string, number>();

function splitModels(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

function getProviderChain(): ProviderChainEntry[] {
  const chain: ProviderChainEntry[] = [];

  const geminiKey = readEnv("GEMINI_API_KEY");
  if (geminiKey) {
    chain.push({
      provider: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
      apiKey: geminiKey,
      models: splitModels(readEnv("GEMINI_MODELS")).length > 0
        ? splitModels(readEnv("GEMINI_MODELS"))
        : ["gemini-flash-latest"],
    });
  }

  const groqKey = readEnv("GROQ_API_KEY");
  if (groqKey) {
    chain.push({
      provider: "groq",
      baseUrl: "https://api.groq.com/openai/v1",
      apiKey: groqKey,
      models: splitModels(readEnv("GROQ_MODELS")).length > 0
        ? splitModels(readEnv("GROQ_MODELS"))
        : ["openai/gpt-oss-120b", "qwen/qwen3.6-27b"],
    });
  }

  const openRouterKey = readEnv("OPENROUTER_API_KEY");
  if (openRouterKey) {
    const unified = splitModels(readEnv("OPENROUTER_MODELS"));
    const legacy =
      splitModels(readEnv("OPENROUTER_FALLBACK_MODELS")).length > 0 ||
      readEnv("OPENROUTER_MODEL")
        ? [
            ...splitModels(readEnv("OPENROUTER_MODEL")),
            ...splitModels(readEnv("OPENROUTER_FALLBACK_MODELS")),
          ]
        : [];

    chain.push({
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      apiKey: openRouterKey,
      models: unified.length > 0 ? unified : legacy,
      extraHeaders: {
        "HTTP-Referer":
          process.env.NEXTAUTH_URL ?? "https://territoriosapp.duckdns.org",
        "X-Title": "Territorios App",
      },
    });
  }

  return chain;
}

function safeParseArgs(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return {};
}

async function callModel(
  entry: ProviderChainEntry,
  model: string,
  messages: ChatMessage[],
  tools?: ToolDefinition[]
): Promise<CompletionResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${entry.baseUrl}/chat/completions`, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${entry.apiKey}`,
        "Content-Type": "application/json",
        ...entry.extraHeaders,
      },
      body: JSON.stringify({
        model,
        messages,
        ...(tools && tools.length > 0 ? { tools } : {}),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `[${entry.provider}] ${response.status} para ${model}: ${detail.slice(0, 300)}`
      );
    }

    const data = (await response.json()) as {
      model?: string;
      choices?: Array<{
        message?: {
          content?: string | null;
          tool_calls?: Array<{
            id?: string;
            function?: { name?: string; arguments?: string };
          }>;
        };
      }>;
    };

    const message = data.choices?.[0]?.message;
    const content =
      typeof message?.content === "string" ? message.content.trim() : "";

    const toolCalls: AssistantToolCall[] = (message?.tool_calls ?? []).map(
      (call, index) => ({
        id: call.id ?? `${call.function?.name ?? "tool"}-${index}`,
        name: call.function?.name ?? "",
        arguments: safeParseArgs(call.function?.arguments),
      })
    );

    return {
      content,
      toolCalls: toolCalls.filter((call) => call.name),
      model: data.model ?? model,
      provider: entry.provider,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function chatCompletion(options: {
  messages: ChatMessage[];
  tools?: ToolDefinition[];
}): Promise<CompletionResult> {
  const chain = getProviderChain();

  if (chain.length === 0) {
    throw new Error(
      "Falta configurar al menos una API key de IA (GEMINI_API_KEY, GROQ_API_KEY u OPENROUTER_API_KEY)"
    );
  }

  const errors: string[] = [];
  const deadline = Date.now() + TOTAL_DEADLINE_MS;

  for (const entry of chain) {
    for (const model of entry.models) {
      if (Date.now() > deadline) break;

      const cacheKey = `${entry.provider}:${model}`;
      const skipUntil = failedUntil.get(cacheKey);
      if (skipUntil && skipUntil > Date.now()) {
        continue;
      }

      try {
        const result = await callModel(
          entry,
          model,
          options.messages,
          options.tools
        );
        failedUntil.delete(cacheKey);
        return result;
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        errors.push(detail);
        failedUntil.set(cacheKey, Date.now() + FAILURE_SKIP_MS);
        console.warn(`[llm] falló ${cacheKey}: ${detail}`);
      }
    }
  }

  throw new Error(
    `Todos los proveedores de IA fallaron (${errors.length} intentos)`
  );
}
