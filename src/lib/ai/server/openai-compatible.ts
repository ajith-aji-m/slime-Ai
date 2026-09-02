import "server-only";
import type { StreamChunk } from "@/types/provider";
import type { OpenAIMessage } from "./messages";
import { REQUEST_TIMEOUT_MS } from "./env";

export interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  /** upstream model id */
  model: string;
  messages: OpenAIMessage[];
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
}

interface OpenAIStreamDelta {
  choices?: {
    delta?: { content?: string | null };
    finish_reason?: string | null;
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

/**
 * Streams an OpenAI-compatible `/chat/completions` SSE response and adapts it to
 * Slime's `StreamChunk` protocol. NVIDIA NIM speaks this dialect verbatim; the
 * same function backs any future OpenAI-compatible provider.
 */
export async function* streamOpenAICompatible(
  config: OpenAICompatibleConfig,
): AsyncGenerator<StreamChunk> {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), REQUEST_TIMEOUT_MS);
  const signal = config.signal
    ? AbortSignal.any([config.signal, timeout.signal])
    : timeout.signal;

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: config.model,
        messages: config.messages,
        stream: true,
        stream_options: { include_usage: true },
        temperature: config.temperature ?? 0.7,
        ...(config.maxTokens ? { max_tokens: config.maxTokens } : {}),
      }),
      signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (isAbort(error)) {
      if (timedOut(timeout, config.signal)) {
        yield {
          type: "error",
          message: "The provider timed out.",
          code: "timeout",
        };
      }
      return; // client cancelled — stop silently
    }
    yield {
      type: "error",
      message: `Could not reach the provider: ${message(error)}`,
      code: "network",
    };
    return;
  }

  if (!response.ok || !response.body) {
    clearTimeout(timer);
    const detail = await safeText(response);
    yield {
      type: "error",
      message: upstreamError(response.status, detail),
      code: `http_${response.status}`,
    };
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let textOpen = false;
  let sawContent = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const raw of lines) {
        const line = raw.trim();
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;

        let json: OpenAIStreamDelta;
        try {
          json = JSON.parse(data);
        } catch {
          continue;
        }

        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          sawContent = true;
          if (!textOpen) {
            textOpen = true;
            yield { type: "part-start", part: { type: "text", text: "" } };
          }
          yield { type: "text-delta", text: delta };
        }

        if (json.usage) {
          yield {
            type: "usage",
            usage: {
              promptTokens: json.usage.prompt_tokens,
              completionTokens: json.usage.completion_tokens,
              totalTokens: json.usage.total_tokens,
            },
          };
        }
      }
    }

    if (textOpen) yield { type: "part-end" };
    if (!sawContent) {
      yield {
        type: "error",
        message: "The provider returned an empty response.",
        code: "empty",
      };
      return;
    }
    yield { type: "done" };
  } catch (error) {
    if (isAbort(error)) {
      if (textOpen) yield { type: "part-end" };
      if (timedOut(timeout, config.signal)) {
        yield {
          type: "error",
          message: "The provider timed out mid-response.",
          code: "timeout",
        };
      }
      return;
    }
    yield {
      type: "error",
      message: `Stream interrupted: ${message(error)}`,
      code: "stream",
    };
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/** True when our own timeout fired rather than the caller cancelling. */
function timedOut(
  timeout: AbortController,
  clientSignal?: AbortSignal,
): boolean {
  return timeout.signal.aborted && !clientSignal?.aborted;
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function safeText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 500);
  } catch {
    return "";
  }
}

function upstreamError(status: number, detail: string): string {
  if (status === 401 || status === 403) {
    return "The provider rejected the API key. Check NVIDIA_API_KEY.";
  }
  if (status === 404) {
    return "The provider does not recognise this model id.";
  }
  if (status === 429) {
    return "Rate limited by the provider. Try again shortly.";
  }
  const trimmed = detail.replace(/\s+/g, " ").trim();
  return `Provider error ${status}${trimmed ? `: ${trimmed}` : ""}`;
}
