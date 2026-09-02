import type { ChatProvider } from "@/types/provider";
import { catalogue } from "@/stores/catalogue-store";
import { mockChatProvider } from "./mock-provider";
import { httpChatProvider } from "./http-provider";

/**
 * Client-side provider resolution.
 *
 * - `slime` (built-in) → runs in the browser, offline, mock responses.
 * - anything else       → `httpChatProvider`, which forwards to `/api/chat`
 *                         where the real provider + credentials live.
 *
 * The `ChatProvider` interface is identical for both, so callers
 * (`conversation-store`) never branch on provider type.
 */
export function getProviderForModel(modelId: string): ChatProvider {
  const providerId = catalogue.providerIdForModel(modelId);
  if (!providerId || providerId === "slime") return mockChatProvider;
  return httpChatProvider;
}

export { mockChatProvider, httpChatProvider };
