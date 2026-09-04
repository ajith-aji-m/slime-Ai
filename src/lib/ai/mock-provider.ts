import type {
  ChatProvider,
  ChatRequest,
  ProviderInfo,
  StreamChunk,
} from "@/types/provider";
import { buildMockResponse } from "./mock-content";

const info: ProviderInfo = {
  id: "mock",
  name: "Slime AI",
  description:
    "Built-in offline provider. Streams canned multi-part responses for development.",
  icon: "auto_awesome",
  kind: "Built-in",
  status: "connected",
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(t);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });

/**
 * Fulfils the ChatProvider contract with local mock data. Streams text
 * word-by-word and non-text parts atomically, mirroring how a real
 * OpenAI-compatible stream would arrive.
 */
export const mockChatProvider: ChatProvider = {
  info,
  models: [],

  async *streamChat({
    messages,
    tools,
    signal,
  }: ChatRequest): AsyncIterable<StreamChunk> {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const prompt = lastUser?.parts
      .map((p) => (p.type === "text" ? p.text : ""))
      .join(" ")
      .trim();
    const hasImage = lastUser?.attachments?.some((a) =>
      a.mimeType.startsWith("image/"),
    );

    try {
      await sleep(280, signal);
      // Honest about a real limitation rather than a canned response that
      // ignores the attachment (or worse, hallucinates having seen it): the
      // offline mock provider never reads file contents, image included.
      const parts = hasImage
        ? [
            {
              type: "text" as const,
              text: "I can see you've attached an image, but I'm running in offline demo mode right now and can't analyze image contents. Configure a real NVIDIA connection to get an actual answer about it.",
            },
          ]
        : buildMockResponse(prompt ?? "", tools);

      for (const part of parts) {
        if (signal?.aborted) return;

        if (part.type === "text") {
          yield { type: "part-start", part: { type: "text", text: "" } };
          const words = part.text.split(" ");
          for (let i = 0; i < words.length; i += 1) {
            await sleep(18 + (i % 5) * 8, signal);
            yield {
              type: "text-delta",
              text: i === 0 ? words[i] : ` ${words[i]}`,
            };
          }
          yield { type: "part-end" };
        } else {
          await sleep(320, signal);
          yield { type: "part-start", part };
          yield { type: "part-end" };
        }
      }

      const words = parts.reduce(
        (n, p) => n + (p.type === "text" ? p.text.split(/\s+/).length : 0),
        0,
      );
      const completionTokens = Math.round(words * 1.3);
      const promptTokens = Math.round((prompt ?? "").split(/\s+/).length * 1.3);
      yield {
        type: "usage",
        usage: {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
        },
      };

      yield { type: "done" };
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      yield {
        type: "error",
        message: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};
