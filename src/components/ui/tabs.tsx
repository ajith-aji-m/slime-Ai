"use client";

import { cn } from "@/lib/utils/cn";
import { Icon, type IconName } from "./icon";

export interface TabItem {
  id: string;
  label: string;
  icon?: IconName;
}

export interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (id: string) => void;
  /** underline row (desktop) vs stacked icon+label (mobile drawer) */
  layout?: "inline" | "stacked";
  className?: string;
  "aria-label": string;
}

/** Underlined tab bar — DESIGN.md "border-b-2 border-primary" active treatment. */
export function Tabs({
  tabs,
  value,
  onValueChange,
  layout = "inline",
  className,
  "aria-label": ariaLabel,
}: TabsProps) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn("flex border-b border-outline-variant", className)}
    >
      {tabs.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(tab.id)}
            className={cn(
              "flex-1 border-b-2 px-2 py-3.5 text-xs font-semibold tracking-wide transition-colors",
              layout === "stacked" &&
                "flex flex-col items-center justify-center gap-1",
              active
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-primary",
            )}
          >
            {tab.icon ? <Icon name={tab.icon} size={18} /> : null}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
