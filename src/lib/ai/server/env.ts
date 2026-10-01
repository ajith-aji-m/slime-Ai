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

export interface GroqEnv {
  apiKey: string;
  baseUrl: string;
  /** optional JSON override of the Groq model list */
  modelsJson?: string;
}

/** Same shape as `readNvidiaEnv` — Groq's API is OpenAI-compatible too, so
 * `streamOpenAICompatible` backs both. See `./groq.ts`. */
export function readGroqEnv(): GroqEnv | null {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: (
      process.env.GROQ_BASE_URL?.trim() || "https://api.groq.com/openai/v1"
    ).replace(/\/$/, ""),
    modelsJson: process.env.GROQ_MODELS?.trim() || undefined,
  };
}

export type UpstreamProviderId = "nvidia" | "groq";

/**
 * Explicit `AI_PROVIDER` choice, when set — the "switch" the two upstream
 * providers share. Unset (the common case: only one key configured) means
 * "use whichever is configured"; see `activeProvider()` in `./provider.ts`
 * for how this combines with which API key(s) are actually present.
 */
export function readRequestedProvider(): UpstreamProviderId | null {
  const raw = process.env.AI_PROVIDER?.trim().toLowerCase();
  return raw === "nvidia" || raw === "groq" ? raw : null;
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
