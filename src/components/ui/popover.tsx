"use client";

import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface PopoverProps {
  trigger: (props: {
    open: boolean;
    toggle: () => void;
    id: string;
    triggerId: string;
  }) => React.ReactNode;
  children: (props: { close: () => void }) => React.ReactNode;
  align?: "start" | "end";
  side?: "top" | "bottom";
  className?: string;
}

/** Minimal outside-click / Esc dismissable popover. */
export function Popover({
  trigger,
  children,
  align = "start",
  side = "bottom",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const triggerId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      {trigger({
        open,
        toggle: () => setOpen((v) => !v),
        id: panelId,
        triggerId,
      })}
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={triggerId}
          className={cn(
            "absolute z-50 min-w-[240px] rounded-xl border border-outline-variant bg-surface-container-lowest p-1.5 shadow-ambient",
            side === "bottom" ? "top-[calc(100%+8px)]" : "bottom-[calc(100%+8px)]",
            align === "start" ? "left-0" : "right-0",
            className,
          )}
        >
          {children({ close: () => setOpen(false) })}
        </div>
      ) : null}
    </div>
  );
}
