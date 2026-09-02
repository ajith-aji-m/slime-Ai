import type {
  ChatProvider,
  ChatRequest,
  ProviderInfo,
  StreamChunk,
} from "@/types/provider";

const info: ProviderInfo = {
  id: "http",
  name: "Server providers",
  description: "Routes to a server-side provider via /api/chat.",
  icon: "cloud",
  kind: "Server",
  status: "connected",
};

/**
 * Client-side `ChatProvider` that delegates to the server. It never sees an API
 * key — it just POSTs the conversation to `/api/chat` and re-emits the NDJSON
 * `StreamChunk` stream. Used for every real provider (NVIDIA today).
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
          modelId: request.modelId,
          messages: request.messages,
          tools: request.tools,
        }),
        signal: request.signal,
      });
    } catch (error) {
      if (isAbort(error)) return;
      yield {
        type: "error",
        message: "Could not reach the Slime server.",
        code: "network",
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
        message: detail || `Server responded ${response.status}`,
        code: `http_${response.status}`,
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
        message: "Connection to the Slime server was interrupted.",
        code: "stream",
      };
    } finally {
      reader.releaseLock();
    }
  },
};

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}
