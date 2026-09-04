"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/ui";
import { useConversationStore } from "@/stores/conversation-store";
import { MessageList } from "./message-list";
import { Composer } from "./composer";

export function ConversationView({ conversationId }: { conversationId: string }) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const hydrated = useConversationStore((s) => s.hydrated);
  const conversation = useConversationStore(
    (s) => s.conversations[conversationId],
  );
  const knownSummary = useConversationStore((s) =>
    s.summaries.some((sum) => sum.id === conversationId),
  );

  useEffect(() => {
    void useConversationStore.getState().loadConversation(conversationId);
  }, [conversationId]);

  if (!conversation) {
    if (hydrated && !knownSummary) {
      return (
        <div className="flex h-full items-center justify-center">
          <EmptyState
            icon="chat"
            title="Conversation not found"
            description="It may have been deleted or cleared from this device."
            action={
              <button
                type="button"
                onClick={() => router.push("/chat")}
                className="text-sm font-medium text-primary hover:underline"
              >
                Start a new chat
              </button>
            }
          />
        </div>
      );
    }
    return (
      <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
        Loading conversation…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
        {conversation.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState icon="smart_toy" title="How can I assist you today?" />
          </div>
        ) : (
          <MessageList conversation={conversation} scrollRef={scrollRef} />
        )}
      </div>
      <div className="shrink-0 bg-gradient-to-t from-surface-container-low/85 to-transparent px-2 pb-3 pt-4">
        <Composer conversationId={conversationId} autoFocus />
      </div>
    </div>
  );
}
