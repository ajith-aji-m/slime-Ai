import { aiMode } from "@/stores/ai-status-store";
import type { Message } from "@/types/chat";
import { buildTitleRequestMessages, mockGenerateTitle } from "@/lib/title";

/**
 * One-shot, non-streaming: generates a short title for a conversation from
 * its actual messages so far. Used to correct the naive first-message
 * truncation `conversation-store` sets instantly at send time, once there's
 * enough context (a real reply, not just the raw prompt) to do better.
 *
 * Deliberately outside the `ChatProvider` interface — this never streams,
 * never becomes a message in the thread, and the caller decides what (if
 * anything) to do with the result, so it doesn't belong on the same contract
 * as `streamChat`.
 */
export async function generateConversationTitle(
  messages: Message[],
  signal?: AbortSignal,
): Promise<string | null> {
  if (aiMode() === "mock") {
    return mockGenerateTitle(messages);
  }

  try {
    const response = await fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: buildTitleRequestMessages(messages) }),
      signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { title?: string | null };
    return data.title?.trim() || null;
  } catch {
    return null;
  }
}
