import "server-only";
import type { ChatRequest, ModelInfo, StreamChunk } from "@/types/provider";
import { models as staticModels, providers } from "@/config/providers";
import { isNvidiaConfigured, nvidiaModels, streamNvidiaChat } from "./nvidia";

/**
 * Server-side provider registry. Maps a provider id to a `streamChat`
 * implementation that runs on the server with credentials.
 *
 * NVIDIA is the only real provider wired today. Add the next one here.
 */
type ServerStreamFn = (request: ChatRequest) => AsyncGenerator<StreamChunk>;

const serverProviders: Record<string, ServerStreamFn> = {
  nvidia: streamNvidiaChat,
};

/** Which model ids belong to a real, server-backed provider. */
export function serverModelIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const model of nvidiaModels()) index.set(model.id, "nvidia");
  return index;
}

export function getServerStreamFn(
  modelId: string,
): ServerStreamFn | null {
  const providerId = serverModelIndex().get(modelId);
  return providerId ? (serverProviders[providerId] ?? null) : null;
}

function providerConfigured(providerId: string): boolean {
  if (providerId === "nvidia") return isNvidiaConfigured();
  return false;
}

/**
 * The live catalogue served by `GET /api/models`: static metadata + runtime
 * availability + any env-defined models.
 */
export function getLiveCatalogue(): {
  providers: typeof providers;
  models: ModelInfo[];
} {
  const nonReal = staticModels.filter((m) => m.providerId === "slime");
  const nvidia = nvidiaModels().map((m) => ({
    ...m,
    available: isNvidiaConfigured(),
  }));

  const liveProviders = providers.map((p) =>
    p.id === "slime"
      ? p
      : {
          ...p,
          status: providerConfigured(p.id)
            ? ("connected" as const)
            : p.status,
        },
  );

  return { providers: liveProviders, models: [...nonReal, ...nvidia] };
}
