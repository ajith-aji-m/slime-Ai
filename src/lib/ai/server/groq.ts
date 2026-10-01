import "server-only";
import type { Message } from "@/types/chat";
import type { StreamChunk } from "@/types/provider";
import { DEFAULT_GROQ_MODELS, type RegistryModel } from "@/config/models";
import type { TaskCategory } from "@/config/ai-router";
import { readGroqEnv } from "./env";
import { toOpenAIMessages, toOpenAIVisionMessages } from "./messages";
import { streamOpenAICompatible } from "./openai-compatible";

const SYSTEM_PROMPT =
  "You are Slime AI, a premium AI workstation assistant. Be precise and concise. Use Markdown, and fenced code blocks with a language tag for code. Never mention which underlying model or provider you are.";

const VISION_SYSTEM_PROMPT =
  "You are Slime AI, a premium AI workstation assistant. The user has attached an image — look at it carefully and answer their question about it directly and concisely. Never mention which underlying model or provider you are.";

interface EnvModel {
  id: string;
  upstreamId: string;
  contextWindow?: number;
  strengths?: TaskCategory[];
  order?: number;
  image?: boolean;
  endpoint?: string;
  vision?: boolean;
}

function envRegistry(): RegistryModel[] | null {
  const env = readGroqEnv();
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
        image: m.image ?? false,
        endpoint: m.endpoint,
        vision: m.vision ?? false,
      }));
  } catch {
    return null;
  }
}

/** The internal Groq model registry (env override wins). Same role-id
 * namespace as `nvidiaRegistry()` — see `DEFAULT_GROQ_MODELS`'s comment. */
export function groqRegistry(): RegistryModel[] {
  return envRegistry() ?? DEFAULT_GROQ_MODELS;
}

export function isGroqConfigured(): boolean {
  return readGroqEnv() !== null;
}

/** Mirrors `supportsImageGeneration` in `nvidia.ts` — false for the default
 * registry (Groq has no image-generation entry; see DEFAULT_GROQ_MODELS'
 * comment), but still checks an env override honestly rather than hard-coding
 * false. Not currently read anywhere: Image Gen stays NVIDIA-specific
 * regardless of the active chat provider (see router.ts). Kept for parity /
 * in case that scoping decision changes later. */
export function supportsGroqImageGeneration(): boolean {
  return isGroqConfigured() && groqRegistry().some((m) => m.image === true);
}

/** Mirrors `supportsImageUnderstanding` in `nvidia.ts`. False for the
 * default registry (see DEFAULT_GROQ_MODELS' comment on why no
 * `slime-vision` entry ships by default) — true only once one is added via
 * `GROQ_MODELS`. */
export function supportsGroqImageUnderstanding(): boolean {
  return isGroqConfigured() && groqRegistry().some((m) => m.vision === true);
}

/**
 * Low-level: stream ONE Groq model. The internal router owns model choice
 * and fallback — this just does the call and normalises to `StreamChunk`.
 * Identical shape to `streamNvidiaModel`; Groq's API is OpenAI-compatible,
 * so the same `streamOpenAICompatible` does the actual work.
 */
export async function* streamGroqModel(params: {
  upstreamId: string;
  messages: Message[];
  signal?: AbortSignal;
  temperature?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}): AsyncGenerator<StreamChunk> {
  const env = readGroqEnv();
  if (!env) {
    yield {
      type: "error",
      message: "Groq is not configured on the server.",
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
    temperature: params.temperature,
    frequencyPenalty: params.frequencyPenalty,
    presencePenalty: params.presencePenalty,
  });
}

/** Like `streamGroqModel`, but embeds the newest user message's image(s) as
 * vision content — only useful once a `vision: true` entry exists in the
 * active Groq registry (none by default; see DEFAULT_GROQ_MODELS). */
export async function* streamGroqVision(params: {
  upstreamId: string;
  messages: Message[];
  signal?: AbortSignal;
}): AsyncGenerator<StreamChunk> {
  const env = readGroqEnv();
  if (!env) {
    yield {
      type: "error",
      message: "Groq is not configured on the server.",
      code: "not_configured",
    };
    return;
  }

  yield* streamOpenAICompatible({
    baseUrl: env.baseUrl,
    apiKey: env.apiKey,
    model: params.upstreamId,
    messages: toOpenAIVisionMessages(params.messages, VISION_SYSTEM_PROMPT),
    signal: params.signal,
  });
}
