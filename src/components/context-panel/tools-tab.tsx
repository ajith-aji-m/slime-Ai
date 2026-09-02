"use client";

import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { tools } from "@/config/tools";
import { useConversationStore } from "@/stores/conversation-store";
import { useModelStore } from "@/stores/model-store";

export function ToolsTab({ conversationId }: { conversationId?: string }) {
  const conversation = useConversationStore((s) =>
    conversationId ? s.conversations[conversationId] : undefined,
  );
  const toggleConversationTool = useConversationStore((s) => s.toggleTool);
  const defaultTools = useModelStore((s) => s.defaultTools);
  const toggleDefaultTool = useModelStore((s) => s.toggleDefaultTool);

  const active = conversation?.tools ?? defaultTools;

  return (
    <div className="space-y-1 p-3">
      <h3 className="px-1 pb-2 text-sm font-semibold text-on-surface">
        Tools
      </h3>
      {tools.map((tool) => {
        const enabled = active.includes(tool.id);
        return (
          <button
            key={tool.id}
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() =>
              conversationId
                ? toggleConversationTool(conversationId, tool.id)
                : toggleDefaultTool(tool.id)
            }
            className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-variant"
          >
            <span
              className={cn(
                "mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg",
                enabled
                  ? "bg-primary text-on-primary"
                  : "bg-surface-variant text-on-surface-variant",
              )}
            >
              <Icon name={tool.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium text-on-surface">
                {tool.label}
              </span>
              <span className="block text-xs text-on-surface-variant">
                {tool.description}
              </span>
            </span>
            <span
              className={cn(
                "mt-1 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors",
                enabled ? "bg-primary" : "bg-surface-variant",
              )}
            >
              <span
                className={cn(
                  "block h-4 w-4 rounded-full bg-white transition-transform",
                  enabled && "translate-x-4",
                )}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
