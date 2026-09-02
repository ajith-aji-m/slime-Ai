import type { ChatProvider } from "@/types/provider";
import { modelsById } from "@/config/providers";
import { mockChatProvider } from "./mock-provider";

/**
 * Provider registry. Real providers register here later keyed by `providerId`.
 * Everything resolves to the mock provider until then.
 */
const registry: Record<string, ChatProvider> = {
  slime: mockChatProvider,
};

export function getProviderForModel(modelId: string): ChatProvider {
  const providerId = modelsById[modelId]?.providerId;
  return (providerId && registry[providerId]) || mockChatProvider;
}

export { mockChatProvider };
