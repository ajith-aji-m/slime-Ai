"use client";

import { useRouter } from "next/navigation";
import { Card, Icon } from "@/components/ui";
import { suggestions, type SuggestionAccent } from "@/config/suggestions";
import { useConversationStore } from "@/stores/conversation-store";
import type { ToolId } from "@/types/chat";

const ACCENT: Record<SuggestionAccent, string> = {
  purple: "bg-primary/10 text-primary",
  green: "bg-success/10 text-success",
  blue: "bg-[#2563eb]/10 text-[#2563eb]",
  amber: "bg-warning/10 text-warning",
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
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {suggestions.map((s) => (
        <Card key={s.title} interactive className="p-0">
          <button
            type="button"
            onClick={() => start(s.prompt, s.tool)}
            className="flex h-full w-full flex-col gap-3 rounded-[inherit] p-5 text-left"
          >
            <span
              className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${ACCENT[s.accent]}`}
            >
              <Icon name={s.icon} size={22} />
            </span>
            <span className="text-[15px] font-semibold text-on-surface">
              {s.title}
            </span>
            <span className="line-clamp-2 text-[13px] leading-relaxed text-on-surface-variant">
              {s.description}
            </span>
          </button>
        </Card>
      ))}
    </div>
  );
}
