import "server-only";
import type { ChatRequest, ModelInfo, StreamChunk } from "@/types/provider";
import { models as staticModels } from "@/config/providers";
import { readNvidiaEnv } from "./env";
import { toOpenAIMessages } from "./messages";
import { streamOpenAICompatible } from "./openai-compatible";

const SYSTEM_PROMPT =
  "You are Slime Core, the assistant inside the Slime AI workstation. Be precise and concise. Use Markdown, and fenced code blocks with a language tag for code.";

interface EnvModel {
  id: string;
  upstreamId: string;
  name: string;
  description?: string;
  contextWindow?: number;
  tier?: "free" | "pro";
  toolCalling?: boolean;
}

function envModels(): ModelInfo[] | null {
  const env = readNvidiaEnv();
  if (!env?.modelsJson) return null;
  try {
    const parsed = JSON.parse(env.modelsJson) as EnvModel[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map((m) => ({
      id: m.id,
      upstreamId: m.upstreamId,
      providerId: "nvidia",
      name: m.name,
      description: m.description ?? "Configured via NVIDIA_MODELS.",
      badges: [],
      contextWindow: m.contextWindow ?? 128_000,
      capabilities: ["code"],
      streaming: true,
      toolCalling: m.toolCalling ?? false,
      available: true,
      tier: m.tier ?? "free",
    }));
  } catch {
    return null;
  }
}

/** Model Registry entries this provider can serve. Env list wins if present. */
export function nvidiaModels(): ModelInfo[] {
  return (
    envModels() ??
    staticModels
      .filter((m) => m.providerId === "nvidia")
      .map((m) => ({ ...m, available: true }))
  );
}

export function isNvidiaConfigured(): boolean {
  return readNvidiaEnv() !== null;
}

const nvidiaModelsById = () =>
  Object.fromEntries(nvidiaModels().map((m) => [m.id, m]));

/**
 * Server-side NVIDIA NIM provider. Implements the same `streamChat` contract as
 * the mock provider, but runs only on the server and never returns the API key.
 */
export async function* streamNvidiaChat(
  request: ChatRequest,
): AsyncGenerator<StreamChunk> {
  const env = readNvidiaEnv();
  if (!env) {
    yield {
      type: "error",
      message: "NVIDIA is not configured on the server (missing NVIDIA_API_KEY).",
      code: "not_configured",
    };
    return;
  }

  const model = nvidiaModelsById()[request.modelId];
  if (!model?.upstreamId) {
    yield {
      type: "error",
      message: `Unknown NVIDIA model: ${request.modelId}`,
      code: "unknown_model",
    };
    return;
  }

  yield* streamOpenAICompatible({
    baseUrl: env.baseUrl,
    apiKey: env.apiKey,
    model: model.upstreamId,
    messages: toOpenAIMessages(request.messages, SYSTEM_PROMPT),
    signal: request.signal,
  });
}
