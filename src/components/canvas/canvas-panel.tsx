"use client";

import { EmptyState } from "@/components/ui";
import { useCanvasStore } from "@/stores/canvas-store";
import { CanvasHeader } from "./canvas-header";
import { CanvasContent } from "./canvas-content";

/**
 * Canvas body — header + type-specific content. Shared verbatim by the desktop
 * side panel and the mobile full-screen workspace.
 */
export function CanvasPanel() {
  const activeId = useCanvasStore((s) => s.activeId);
  const artifact = useCanvasStore((s) => (activeId ? s.artifacts[activeId] : undefined));
  const close = useCanvasStore((s) => s.close);

  if (!artifact) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon="space_dashboard"
          title="Nothing in Canvas yet"
          description="Structured output — code, tables, reports, images — opens here."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <CanvasHeader artifact={artifact} onClose={close} />
      <div className="min-h-0 flex-1">
        <CanvasContent artifact={artifact} />
      </div>
    </div>
  );
}
