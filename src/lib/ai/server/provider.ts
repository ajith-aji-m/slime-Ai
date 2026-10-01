import "server-only";
import type { Message } from "@/types/chat";
import type { StreamChunk } from "@/types/provider";
import type { RegistryModel } from "@/config/models";
import { readRequestedProvider, type UpstreamProviderId } from "./env";
import {
  isGroqConfigured,
  groqRegistry,
  streamGroqModel,
  streamGroqVision,
  supportsGroqImageUnderstanding,
} from "./groq";
import {
  isNvidiaConfigured,
  nvidiaRegistry,
  streamNvidiaModel,
  streamNvidiaVision,
  supportsImageUnderstanding as supportsNvidiaImageUnderstanding,
} from "./nvidia";

export type { UpstreamProviderId };

/**
 * Which upstream chat provider the router actually calls, resolved fresh on
 * every call (env reads are cheap and this way a config change takes effect
 * on the next request, no restart/caching to worry about) from `AI_PROVIDER`
 * ("the switch") plus whichever API key(s) are actually set:
 *
 * - `AI_PROVIDER` explicitly set to a provider whose key IS configured →
 *   that provider, full stop — an explicit choice is honored even if the
 *   other provider is also configured.
 * - `AI_PROVIDER` set to a provider whose key is NOT configured → falls
 *   back to whichever other provider IS configured, rather than going
 *   straight to the offline mock over what's likely a one-line env mistake.
 * - `AI_PROVIDER` unset → NVIDIA if configured (the original/default
 *   integration), else Groq if that's what's set up instead.
 * - Neither configured → null; `routeChat` reports "not configured" and the
 *   client already fell back to the mock provider before ever reaching here
 *   (see `/api/ai/status`'s `mode`).
 */
export function activeProvider(): UpstreamProviderId | null {
  const nvidiaReady = isNvidiaConfigured();
  const groqReady = isGroqConfigured();
  const requested = readRequestedProvider();

  if (requested === "groq") return groqReady ? "groq" : nvidiaReady ? "nvidia" : null;
  if (requested === "nvidia") return nvidiaReady ? "nvidia" : groqReady ? "groq" : null;
  if (nvidiaReady) return "nvidia";
  if (groqReady) return "groq";
  return null;
}

export function isAiConfigured(): boolean {
  return activeProvider() !== null;
}

/** The active provider's model registry — same role-id namespace either way
 * (see `DEFAULT_GROQ_MODELS`'s comment in `config/models.ts`), so every
 * provider-agnostic caller (`planModels`, `CATEGORY_ROUTING`) just works. */
export function activeRegistry(): RegistryModel[] {
  return activeProvider() === "groq" ? groqRegistry() : nvidiaRegistry();
}

/** Whether the active provider has a registry entry that can read an
 * attached image — never NVIDIA's registry while Groq is active, or vice
 * versa; vision follows the same switch as ordinary chat. */
export function activeSupportsImageUnderstanding(): boolean {
  return activeProvider() === "groq"
    ? supportsGroqImageUnderstanding()
    : supportsNvidiaImageUnderstanding();
}

export function streamActiveModel(params: {
  upstreamId: string;
  messages: Message[];
  signal?: AbortSignal;
  temperature?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}): AsyncGenerator<StreamChunk> {
  return activeProvider() === "groq"
    ? streamGroqModel(params)
    : streamNvidiaModel(params);
}

export function streamActiveVision(params: {
  upstreamId: string;
  messages: Message[];
  signal?: AbortSignal;
}): AsyncGenerator<StreamChunk> {
  return activeProvider() === "groq"
    ? streamGroqVision(params)
    : streamNvidiaVision(params);
}
