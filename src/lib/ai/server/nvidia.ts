import "server-only";
import type { Message } from "@/types/chat";
import type { StreamChunk } from "@/types/provider";
import { DEFAULT_NVIDIA_MODELS, type RegistryModel } from "@/config/models";
import type { TaskCategory } from "@/config/ai-router";
import { readNvidiaEnv } from "./env";
import { toOpenAIMessages } from "./messages";
import { streamOpenAICompatible } from "./openai-compatible";

const SYSTEM_PROMPT =
  "You are Slime AI, a premium AI workstation assistant. Be precise and concise. Use Markdown, and fenced code blocks with a language tag for code. Never mention which underlying model or provider you are.";

interface EnvModel {
  id: string;
  upstreamId: string;
  contextWindow?: number;
  strengths?: TaskCategory[];
  order?: number;
}

function envRegistry(): RegistryModel[] | null {
  const env = readNvidiaEnv();
  if (!env?.modelsJson) return null;
  try {
    const parsed = JSON.parse(env.modelsJson) as EnvModel[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed
      .filter((m) => m.id && m.upstreamId)
      .map((m, i) => ({
        id: m.id,
        upstreamId: m.upstreamId,
        contextWindow: m.contextWindow ?? 128_000,
        streaming: true,
        strengths: m.strengths ?? ["general"],
        order: m.order ?? i + 1,
      }));
  } catch {
    return null;
  }
}

/** The internal NVIDIA model registry (env override wins). */
export function nvidiaRegistry(): RegistryModel[] {
  return envRegistry() ?? DEFAULT_NVIDIA_MODELS;
}

export function isNvidiaConfigured(): boolean {
  return readNvidiaEnv() !== null;
}

/**
 * Low-level: stream ONE NVIDIA model. The internal router owns model choice and
 * fallback — this just does the call and normalises to `StreamChunk`.
 */
export async function* streamNvidiaModel(params: {
  upstreamId: string;
  messages: Message[];
  signal?: AbortSignal;
}): AsyncGenerator<StreamChunk> {
  const env = readNvidiaEnv();
  if (!env) {
    yield {
      type: "error",
      message: "NVIDIA is not configured on the server.",
      code: "not_configured",
    };
    return;
  }

  yield* streamOpenAICompatible({
    baseUrl: env.baseUrl,
    apiKey: env.apiKey,
    model: params.upstreamId,
    messages: toOpenAIMessages(params.messages, SYSTEM_PROMPT),
    signal: params.signal,
  });
}
