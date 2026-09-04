import type { Conversation } from "@/types/chat";
import type { ActivityEvent } from "@/types/workspace";
import { toolsById } from "@/config/tools";
import { formatBytes } from "@/lib/utils/format";

/**
 * Derives the Activity tab's timeline straight from a conversation's
 * messages — nothing is logged separately, so it can never drift from what
 * actually happened (same "derive, don't store" approach as
 * `src/lib/canvas/detect.ts`). Newest first.
 */
export function deriveActivity(conversation: Conversation): ActivityEvent[] {
  const events: ActivityEvent[] = [];

  for (const message of conversation.messages) {
    for (const attachment of message.attachments ?? []) {
      events.push({
        id: `${message.id}:file:${attachment.id}`,
        kind: "file",
        title: "File added to context",
        detail: `${attachment.name} · ${formatBytes(attachment.size)}`,
        timestamp: message.createdAt,
        icon: "description",
      });
    }

    if (message.role !== "assistant") continue;

    for (const part of message.parts) {
      if (part.type !== "tool_call") continue;
      const tool = toolsById[part.tool];
      events.push({
        id: `${message.id}:tool:${part.tool}`,
        kind: "tool",
        title: `${tool?.label ?? part.tool} ran`,
        detail: part.detail ?? tool?.description ?? part.label,
        timestamp: message.createdAt,
        icon: tool?.icon ?? "construction",
      });
    }

    if (message.status === "complete" || message.status === undefined) {
      const hasText = message.parts.some(
        (p) => p.type === "text" && p.text.trim(),
      );
      if (hasText) {
        events.push({
          id: `${message.id}:response`,
          kind: "model",
          title: "Slime AI responded",
          detail: message.usage?.totalTokens
            ? `${message.usage.totalTokens} tokens`
            : conversation.title,
          timestamp: message.createdAt,
          icon: "psychology",
        });
      }
    }
  }

  return events.reverse();
}
