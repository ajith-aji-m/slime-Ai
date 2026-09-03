"use client";

import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui";
import { tools } from "@/config/tools";
import type { ToolId } from "@/types/chat";

export function ToolStrip({
  active,
  onToggle,
  variant = "chip",
  align = "center",
}: {
  active: ToolId[];
  onToggle: (id: ToolId) => void;
  /** chip = borderless inline (composer), pill = bordered (welcome quick actions) */
  variant?: "chip" | "pill";
  align?: "start" | "center";
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1.5",
        align === "center" ? "justify-center" : "justify-start",
      )}
    >
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
                "inline-flex items-center gap-1.5 rounded-full text-xs font-semibold transition-colors",
                variant === "pill"
                  ? "border px-3.5 py-2"
                  : "px-2.5 py-1.5",
                on
                  ? variant === "pill"
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "bg-primary/10 text-primary"
                  : variant === "pill"
                    ? "border-outline-variant text-on-surface-variant hover:border-outline hover:text-on-surface"
                    : "text-on-surface-variant hover:bg-surface-variant hover:text-on-surface",
              )}
            >
              <Icon name={tool.icon} size={16} />
              <span className={variant === "pill" ? undefined : "hidden sm:inline"}>
                {tool.label}
              </span>
            </button>
          );
        })}
    </div>
  );
}
