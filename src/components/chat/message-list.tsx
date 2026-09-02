"use client";

import { Fragment, useEffect, useRef } from "react";
import type { Conversation } from "@/types/chat";
import { formatDayLabel } from "@/lib/utils/format";
import { useConversationStore } from "@/stores/conversation-store";
import { DateSeparator } from "./date-separator";
import { UserMessage } from "./user-message";
import { AssistantMessage } from "./assistant-message";

export function MessageList({ conversation }: { conversation: Conversation }) {
  const endRef = useRef<HTMLDivElement>(null);
  const { regenerate, editUserMessage } = useConversationStore.getState();

  const lastPartsLength =
    conversation.messages[conversation.messages.length - 1]?.parts.length ?? 0;

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conversation.messages.length, lastPartsLength]);

  const dayLabels = conversation.messages.map((m) =>
    formatDayLabel(m.createdAt),
  );

  return (
    <div className="mx-auto w-full max-w-thread space-y-8 px-4 py-8 md:px-0">
      {conversation.messages.map((message, index) => {
        const day = dayLabels[index];
        const showDay = index === 0 || dayLabels[index - 1] !== day;
        const isLastAssistant =
          message.role === "assistant" &&
          index === conversation.messages.length - 1;

        return (
          <Fragment key={message.id}>
            {showDay ? <DateSeparator label={day} /> : null}
            {message.role === "user" ? (
              <UserMessage
                message={message}
                onEdit={(text) =>
                  editUserMessage(conversation.id, message.id, text)
                }
              />
            ) : (
              <AssistantMessage
                message={message}
                isLast={isLastAssistant}
                onRegenerate={() => regenerate(conversation.id)}
              />
            )}
          </Fragment>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
