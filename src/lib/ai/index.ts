import type { ChatProvider } from "@/types/provider";
import { aiMode } from "@/stores/ai-status-store";
import { mockChatProvider } from "./mock-provider";
import { httpChatProvider } from "./http-provider";

/**
 * Client-side provider resolution. No model id involved — the internal server
 * router picks the model.
 *
 * - `mock`   → runs in the browser, offline, canned responses.
 * - `nvidia` → `httpChatProvider` → `POST /api/chat` → internal router.
 *
 * Both satisfy the same `ChatProvider` interface, so `conversation-store` never
 * branches on provider type.
 */
export function getChatProvider(): ChatProvider {
  return aiMode() === "nvidia" ? httpChatProvider : mockChatProvider;
}

export { mockChatProvider, httpChatProvider };
