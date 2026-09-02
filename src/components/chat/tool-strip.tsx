"use client";

import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui";
import { tools } from "@/config/tools";
import type { ToolId } from "@/types/chat";

export function ToolStrip({
  active,
  onToggle,
}: {
  active: ToolId[];
  onToggle: (id: ToolId) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {tools
        .filter((t) => t.inComposer)
        .map((tool) => {
          const on = active.includes(tool.id);
          return (
            <button
              key={tool.id}
              type="button"
              role="switch"
              aria-checked={on}
              onClick={() => onToggle(tool.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors",
                on
                  ? "bg-primary-container text-on-primary-container"
                  : "text-on-surface-variant hover:bg-surface-variant hover:text-primary",
              )}
            >
              <Icon name={tool.icon} size={18} />
              <span className="hidden sm:inline">{tool.label}</span>
            </button>
          );
        })}
    </div>
  );
}
