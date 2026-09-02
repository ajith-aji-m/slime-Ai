import type {
  ChatProvider,
  ChatRequest,
  ProviderInfo,
  StreamChunk,
} from "@/types/provider";
import { models } from "@/config/providers";
import { buildMockResponse } from "./mock-content";

const info: ProviderInfo = {
  id: "slime",
  name: "Slime Core",
  description: "Built-in mock provider. Streams canned multi-part responses.",
  icon: "psychology",
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
  models: models.filter((m) => m.providerId === "slime"),

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

    try {
      await sleep(280, signal);
      const parts = buildMockResponse(prompt ?? "", tools);

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
