"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side: "left" | "right";
  /** accessible name for the dialog */
  label: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Off-canvas panel for mobile (nav + intelligence). Handles Esc, scroll lock and
 * a basic focus trap; animates the same slide/backdrop as the exported prototype.
 */
export function Drawer({
  open,
  onClose,
  side,
  label,
  className,
  children,
}: DrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused?.focus?.();
    };
  }, [open, onClose]);

  return (
    <div aria-hidden={!open} className={cn(!open && "pointer-events-none")}>
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-on-surface/20 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0",
        )}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 z-50 flex w-[min(20rem,85vw)] flex-col bg-surface-container-low outline-none",
          "transition-transform duration-300 ease-[var(--ease-emphasized)]",
          side === "left"
            ? "left-0 border-r shadow-[20px_0_40px_rgba(15,23,42,0.1)]"
            : "right-0 border-l shadow-[-20px_0_40px_rgba(15,23,42,0.1)]",
          "border-outline-variant",
          open
            ? "translate-x-0"
            : side === "left"
              ? "-translate-x-full"
              : "translate-x-full",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
