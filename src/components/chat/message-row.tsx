"use client";

import type { Message } from "@/types/chat";
import { DateSeparator } from "./date-separator";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";

export type ThreadItem =
  | { kind: "separator"; id: string; label: string }
  | { kind: "message"; id: string; message: Message; isLastAssistant: boolean };

/** Builds the flat separator+message list a thread renders (virtualized or not). */
export function buildThreadItems(
  messages: Message[],
  dayLabels: string[],
): ThreadItem[] {
  const items: ThreadItem[] = [];
  messages.forEach((message, index) => {
    const day = dayLabels[index];
    if (index === 0 || dayLabels[index - 1] !== day) {
      items.push({ kind: "separator", id: `sep-${day}-${index}`, label: day });
    }
    items.push({
      kind: "message",
      id: message.id,
      message,
      isLastAssistant:
        message.role === "assistant" && index === messages.length - 1,
    });
  });
  return items;
}

export function MessageRow({
  item,
  conversationId,
  onRegenerate,
  onEdit,
  statusLabel,
}: {
  item: ThreadItem;
  conversationId: string;
  onRegenerate: () => void;
  onEdit: (messageId: string, text: string) => void;
  statusLabel?: string;
}) {
  if (item.kind === "separator") {
    return (
      <div className="mx-auto max-w-thread px-4 pb-8 md:px-0">
        <DateSeparator label={item.label} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up mx-auto max-w-thread px-4 pb-8 md:px-0">
      {item.message.role === "user" ? (
        <UserMessage
          message={item.message}
          onEdit={(text) => onEdit(item.message.id, text)}
        />
      ) : (
        <AssistantMessage
          message={item.message}
          conversationId={conversationId}
          isLast={item.isLastAssistant}
          onRegenerate={onRegenerate}
          statusLabel={item.isLastAssistant ? statusLabel : undefined}
        />
      )}
    </div>
  );
}
