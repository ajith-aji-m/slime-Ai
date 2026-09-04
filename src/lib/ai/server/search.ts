import "server-only";
import { readSearchEnv, REQUEST_TIMEOUT_MS } from "./env";

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

export function isSearchConfigured(): boolean {
  return readSearchEnv() !== null;
}

/**
 * Real web search via the Brave Search API. Returns a handful of results for
 * the internal router to ground an answer in and cite — never fabricated:
 * absent an API key, callers must fall back to telling the model (and thus
 * the user) that search isn't available, not to silently answering from
 * memory while pretending to have searched.
 */
export async function searchWeb(
  query: string,
  count = 5,
  signal?: AbortSignal,
): Promise<SearchResult[]> {
  const env = readSearchEnv();
  if (!env || !query.trim()) return [];

  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const combinedSignal = signal
    ? AbortSignal.any([signal, timeout.signal])
    : timeout.signal;

  try {
    const url = new URL("https://api.search.brave.com/res/v1/web/search");
    url.searchParams.set("q", query);
    url.searchParams.set("count", String(count));

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Subscription-Token": env.apiKey,
      },
      signal: combinedSignal,
    });

    if (!response.ok) return [];

    const data = (await response.json()) as {
      web?: { results?: { title?: string; url?: string; description?: string }[] };
    };

    return (data.web?.results ?? [])
      .filter((r): r is { title: string; url: string; description?: string } =>
        !!r.title && !!r.url,
      )
      .slice(0, count)
      .map((r) => ({
        title: r.title,
        url: r.url,
        snippet: (r.description ?? "").replace(/<\/?[^>]+>/g, ""),
      }));
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}
