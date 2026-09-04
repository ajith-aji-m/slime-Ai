import "server-only";
import { isNvidiaConfigured, supportsImageGeneration } from "./nvidia";
import { isSearchConfigured } from "./search";

export { routeChat } from "./router";

export type AiMode = "mock" | "nvidia";

export interface AiStatus {
  mode: AiMode;
  /** whether an image-capable model is configured (never a model name) */
  imageGeneration: boolean;
  /** whether Search mode can ground answers in real results (never an API name) */
  webSearch: boolean;
}

/**
 * Whether the server can serve real responses + non-secret capability flags.
 * The client uses this only to decide between the offline mock provider and the
 * routed provider — it never receives model or provider names.
 */
export function getAiStatus(): AiStatus {
  return {
    mode: isNvidiaConfigured() ? "nvidia" : "mock",
    imageGeneration: supportsImageGeneration(),
    webSearch: isSearchConfigured(),
  };
}
