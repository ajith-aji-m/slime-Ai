import type {
  ChatProvider,
  ChatRequest,
  ProviderInfo,
  StreamChunk,
} from "@/types/provider";

const info: ProviderInfo = {
  id: "routed",
  name: "Slime AI",
  description: "Routes to the internal server-side model router via /api/chat.",
  icon: "auto_awesome",
  kind: "Server",
  status: "connected",
};

/**
 * Client-side `ChatProvider` that delegates to the server. It never sees an API
 * key or a model name — it POSTs the conversation to `/api/chat` and re-emits
 * the NDJSON `StreamChunk` stream produced by the internal router.
 */
export const httpChatProvider: ChatProvider = {
  info,
  models: [],

  async *streamChat(request: ChatRequest): AsyncIterable<StreamChunk> {
    let response: Response;
    try {
      response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: request.messages,
          tools: request.tools,
          taskHint: request.taskHint,
        }),
        signal: request.signal,
      });
    } catch (error) {
      if (isAbort(error)) return;
      yield {
        type: "error",
        message: "Could not reach Slime AI.",
        code: "network",
        recoverable: true,
      };
      return;
    }

    if (!response.ok || !response.body) {
      let detail = "";
      try {
        detail = ((await response.json()) as { error?: string }).error ?? "";
      } catch {
        /* ignore */
      }
      yield {
        type: "error",
        message: detail || "Slime AI is unavailable right now.",
        code: `http_${response.status}`,
        recoverable: response.status >= 500 || response.status === 429,
      };
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            yield JSON.parse(trimmed) as StreamChunk;
          } catch {
            /* skip malformed line */
          }
        }
      }
      if (buffer.trim()) {
        try {
          yield JSON.parse(buffer.trim()) as StreamChunk;
        } catch {
          /* ignore trailing partial */
        }
      }
    } catch (error) {
      if (isAbort(error)) return;
      yield {
        type: "error",
        message: "The connection to Slime AI was interrupted.",
        code: "stream",
        recoverable: true,
      };
    } finally {
      reader.releaseLock();
    }
  },
};

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
