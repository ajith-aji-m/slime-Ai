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
                "inline-flex items-center gap-1.5 font-semibold transition-all duration-300",
                variant === "pill"
                  ? "rounded-2xl border px-4 py-2 text-xs"
                  : "rounded-xl border px-3 py-1 text-xs",
                on
                  ? variant === "pill"
                    ? "liquid-pill-active text-white"
                    : "border-[var(--sl-mode-ring)] bg-[color-mix(in_srgb,var(--sl-primary)_22%,transparent)] text-primary"
                  : variant === "pill"
                    ? "liquid-inner border-white/20 text-on-surface-variant hover:brightness-125"
                    : "border-transparent text-on-surface-variant hover:bg-white/10 hover:text-on-surface",
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
