"use client";

import { useRef } from "react";
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

/** Underlined tab bar with roving focus + arrow-key navigation (WAI-ARIA). */
export function Tabs({
  tabs,
  value,
  onValueChange,
  layout = "inline",
  className,
  "aria-label": ariaLabel,
}: TabsProps) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const keys: Record<string, number> = {
      ArrowLeft: index - 1,
      ArrowRight: index + 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    const nextIndex = (keys[event.key] + tabs.length) % tabs.length;
    onValueChange(tabs[nextIndex].id);
    refs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      aria-orientation="horizontal"
      className={cn("flex border-b border-outline-variant", className)}
    >
      {tabs.map((tab, index) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onValueChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
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
