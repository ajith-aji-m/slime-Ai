import "server-only";
import { supportsImageGeneration } from "./nvidia";
import { activeProvider } from "./provider";
import { isSearchConfigured } from "./search";

export { routeChat } from "./router";

export type AiMode = "mock" | "nvidia" | "groq";

export interface AiStatus {
  mode: AiMode;
  /** whether an image-capable model is configured (never a model name) */
  imageGeneration: boolean;
  /** whether Search mode can ground answers in real results (never an API name) */
  webSearch: boolean;
}

/**
 * Whether the server can serve real responses + non-secret capability flags.
 * The client uses this only to decide between the offline mock provider and
 * the routed provider — it never receives a model name. `mode` does name
 * which upstream is active ("nvidia"/"groq") rather than a fully-abstracted
 * "routed" — that precedent predates the Groq switch (see `AI_PROVIDER` in
 * `env.ts`) and widening it to a second real literal is more honest than
 * collapsing the distinction the client already had to react to correctly
 * (see `getChatProvider` in `src/lib/ai/index.ts` — it must treat BOTH as
 * "use the routed provider", not just "nvidia").
 */
export function getAiStatus(): AiStatus {
  return {
    mode: activeProvider() ?? "mock",
    // Image Gen stays NVIDIA-specific regardless of which provider is
    // active for chat — see `routeImageGeneration` in `router.ts`.
    imageGeneration: supportsImageGeneration(),
    webSearch: isSearchConfigured(),
  };
}
