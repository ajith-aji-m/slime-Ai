"use client";

import { useRouter } from "next/navigation";
import { GlassPanel, Icon } from "@/components/ui";
import { suggestions } from "@/config/suggestions";
import { useConversationStore } from "@/stores/conversation-store";
import { useModelStore } from "@/stores/model-store";

export function SuggestionGrid() {
  const router = useRouter();
  const defaultModelId = useModelStore((s) => s.defaultModelId);

  async function start(prompt: string, tool?: string) {
    const { createConversation, sendMessage } = useConversationStore.getState();
    const tools = tool ? [tool as never] : [];
    const id = createConversation({ modelId: defaultModelId, tools });
    router.push(`/chat/${id}`);
    await sendMessage(id, prompt, { modelId: defaultModelId, tools });
  }

  return (
    <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {suggestions.map((s) => (
        <GlassPanel
          key={s.title}
          as="div"
          className="group relative overflow-hidden"
        >
          <button
            type="button"
            onClick={() => start(s.prompt, s.tool)}
            className="flex h-full w-full flex-col p-5 text-left transition-transform duration-300 hover:-translate-y-1"
          >
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <Icon name={s.icon} size={22} className="mb-3 text-primary" />
            <span className="mb-1 text-sm font-medium text-on-surface">
              {s.title}
            </span>
            <span className="line-clamp-2 text-xs text-on-surface-variant">
              {s.description}
            </span>
          </button>
        </GlassPanel>
      ))}
    </div>
  );
}
