import type { ChatProvider } from "@/types/provider";
import { aiMode } from "@/stores/ai-status-store";
import { mockChatProvider } from "./mock-provider";
import { httpChatProvider } from "./http-provider";

/**
 * Client-side provider resolution. No model id involved — the internal server
 * router picks the model.
 *
 * - `mock`           → runs in the browser, offline, canned responses.
 * - `nvidia`/`groq`  → `httpChatProvider` → `POST /api/chat` → internal
 *   router, which independently resolves which of the two upstream
 *   providers is actually active (see `AI_PROVIDER` / `activeProvider()` in
 *   `src/lib/ai/server/provider.ts`) — the client only needs to know
 *   "routed" vs "offline mock", so this checks `!== "mock"` rather than
 *   naming each provider, and stays correct if a third is ever added.
 *
 * Both satisfy the same `ChatProvider` interface, so `conversation-store` never
 * branches on provider type.
 */
export function getChatProvider(): ChatProvider {
  return aiMode() !== "mock" ? httpChatProvider : mockChatProvider;
}

export { mockChatProvider, httpChatProvider };
