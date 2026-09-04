"use client";

import { useRouter } from "next/navigation";
import { Card, Icon } from "@/components/ui";
import { suggestions, type SuggestionAccent } from "@/config/suggestions";
import { useConversationStore } from "@/stores/conversation-store";
import type { ToolId } from "@/types/chat";

const ACCENT: Record<SuggestionAccent, string> = {
  purple: "bg-primary/15 text-primary",
  green: "bg-success/15 text-success",
  blue: "bg-secondary/15 text-secondary",
  amber: "bg-warning/15 text-warning",
};

export function SuggestionGrid() {
  const router = useRouter();

  async function start(prompt: string, tool?: ToolId) {
    const { createConversation, sendMessage } = useConversationStore.getState();
    const tools: ToolId[] = tool ? [tool] : [];
    const id = createConversation({ tools });
    router.push(`/chat/${id}`);
    await sendMessage(id, prompt, { tools });
  }

  return (
    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
      {suggestions.map((s) => (
        <Card key={s.title} interactive className="p-0">
          <button
            type="button"
            onClick={() => start(s.prompt, s.tool)}
            className="flex h-full w-full items-start gap-3.5 rounded-[inherit] p-4 text-left"
          >
            <span
              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${ACCENT[s.accent]}`}
            >
              <Icon name={s.icon} size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-on-surface">
                {s.title}
              </span>
              <span className="mt-0.5 block text-[13px] leading-snug text-on-surface-variant">
                {s.description}
              </span>
            </span>
          </button>
        </Card>
      ))}
    </div>
  );
}
