"use client";

import { Icon, EmptyState } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/format";
import { deriveActivity } from "@/lib/chat/activity";
import { useConversationStore } from "@/stores/conversation-store";

export function ActivityTab({ conversationId }: { conversationId?: string }) {
  const conversation = useConversationStore((s) =>
    conversationId ? s.conversations[conversationId] : undefined,
  );

  const events = conversation ? deriveActivity(conversation) : [];

  if (events.length === 0) {
    return (
      <EmptyState
        className="h-full"
        icon="analytics"
        title="No activity yet"
        description="Responses, tool runs and files you add to this chat will show up here."
      />
    );
  }

  return (
    <ol className="p-4">
      {events.map((event, index) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant text-primary">
              <Icon name={event.icon} size={16} />
            </span>
            {index < events.length - 1 ? (
              <span className="my-1 w-px flex-1 bg-outline-variant" />
            ) : null}
          </div>
          <div className="pb-5">
            <p className="text-sm font-medium text-on-surface">{event.title}</p>
            <p className="text-xs text-on-surface-variant">{event.detail}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant/70">
              {formatRelativeTime(event.timestamp)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
