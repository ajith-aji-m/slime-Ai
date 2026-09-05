import "server-only";

/**
 * Server-only credential + endpoint configuration. Never import this from a
 * client component — `server-only` will make the build fail if you try.
 */

export interface NvidiaEnv {
  apiKey: string;
  baseUrl: string;
  /** optional JSON override of the NVIDIA model list */
  modelsJson?: string;
}

export function readNvidiaEnv(): NvidiaEnv | null {
  const apiKey = process.env.NVIDIA_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.NVIDIA_BASE_URL?.trim() ||
      "https://integrate.api.nvidia.com/v1"
    ).replace(/\/$/, ""),
    modelsJson: process.env.NVIDIA_MODELS?.trim() || undefined,
  };
}

export const REQUEST_TIMEOUT_MS = Number(
  process.env.AI_REQUEST_TIMEOUT_MS ?? 60_000,
);

export interface SearchEnv {
  apiKey: string;
}

/**
 * Optional real web search backend (Firecrawl's /v1/search endpoint —
 * https://firecrawl.dev). Absent by default: Search mode still works as a
 * routing hint without it, it just can't ground answers in live results —
 * see `isSearchConfigured`/`searchWeb` in `./search.ts`.
 */
export function readSearchEnv(): SearchEnv | null {
  const apiKey = process.env.FIRECRAWL_API_KEY?.trim();
  if (!apiKey) return null;
  return { apiKey };
}
