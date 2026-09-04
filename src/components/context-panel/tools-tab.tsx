"use client";

import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { tools } from "@/config/tools";
import { useConversationStore } from "@/stores/conversation-store";
import { useComposerStore } from "@/stores/composer-store";

export function ToolsTab({ conversationId }: { conversationId?: string }) {
  const conversation = useConversationStore((s) =>
    conversationId ? s.conversations[conversationId] : undefined,
  );
  const toggleConversationTool = useConversationStore((s) => s.toggleTool);
  const defaultTools = useComposerStore((s) => s.defaultTools);
  const toggleDefaultTool = useComposerStore((s) => s.toggleDefaultTool);

  const active = conversation?.tools ?? defaultTools;

  return (
    <div className="flex flex-col gap-2.5 p-3">
      <span className="px-1 text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant/70">
        Tools
      </span>
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
            className="liquid-inner group flex w-full items-center justify-between gap-2.5 rounded-2xl p-3 text-left transition-all hover:brightness-125"
          >
            <span className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--sl-primary)_35%,transparent)] bg-[color-mix(in_srgb,var(--sl-primary)_18%,transparent)] text-primary">
                <Icon name={tool.icon} size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-bold leading-tight text-on-surface">
                  {tool.label}
                </span>
                <span className="mt-0.5 block text-[11px] leading-snug text-on-surface-variant">
                  {tool.description}
                </span>
              </span>
            </span>
            <span
              className={cn(
                "flex h-6 w-10 shrink-0 items-center rounded-full p-0.5 transition-all",
                enabled
                  ? "bg-gradient-to-r from-[var(--sl-primary)] to-[var(--sl-tertiary)] shadow-[0_0_14px_var(--sl-mode-glow)]"
                  : "bg-[color-mix(in_srgb,var(--sl-on-surface)_22%,transparent)]",
              )}
            >
              <span
                className={cn(
                  "block h-5 w-5 rounded-full bg-white shadow-md transition-transform duration-200 ease-out",
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
