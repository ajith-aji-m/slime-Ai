import "server-only";
import { isNvidiaConfigured } from "./nvidia";

export { routeChat } from "./router";

export type AiMode = "mock" | "nvidia";

/**
 * Whether the server can serve real responses. The client uses this only to
 * decide between the offline mock provider and the routed provider — it never
 * receives model or provider names.
 */
export function getAiMode(): AiMode {
  return isNvidiaConfigured() ? "nvidia" : "mock";
}
