"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { useCanvasStore } from "@/stores/canvas-store";
import { CanvasPanel } from "./canvas-panel";

/** Shared width of the desktop Canvas panel — also used to size the inner
 * content so it doesn't reflow during the open/close animation. */
const PANEL_WIDTH = "clamp(22rem,40vw,40rem)";

/**
 * Canvas workspace container. On desktop (lg+) it's an inline panel on the right
 * that smoothly grows the layout — the chat resizes alongside it, no overlay.
 * On smaller screens it becomes a full-screen workspace that slides up over the
 * conversation (which is preserved underneath).
 */
export function CanvasShell() {
  const open = useCanvasStore((s) => s.open);
  const close = useCanvasStore((s) => s.close);

  useEffect(() => {
    if (!open) return;
    const mobile = window.matchMedia("(max-width: 1023px)");
    if (mobile.matches) document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, close]);

  return (
    <>
      {/* Desktop: inline resizing panel */}
      <aside
        aria-hidden={!open}
        aria-label="Canvas workspace"
        className={cn(
          "hidden shrink-0 overflow-hidden lg:block",
          "transition-[width] duration-300 ease-[var(--ease-emphasized)] motion-reduce:transition-none",
          open ? "liquid-glass rounded-3xl" : "w-0",
        )}
        style={{ width: open ? PANEL_WIDTH : 0 }}
      >
        <div className="h-full" style={{ width: PANEL_WIDTH }}>
          <CanvasPanel />
        </div>
      </aside>

      {/* Mobile / tablet: full-screen workspace over the conversation */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Canvas workspace"
        aria-hidden={!open}
        className={cn(
          "fixed inset-0 z-50 flex flex-col bg-[var(--sl-background)]/95 backdrop-blur-xl lg:hidden",
          "transition-transform duration-300 ease-[var(--ease-emphasized)] motion-reduce:transition-none",
          open ? "translate-y-0" : "pointer-events-none translate-y-full",
        )}
      >
        {open ? <CanvasPanel /> : null}
      </div>
    </>
  );
}
