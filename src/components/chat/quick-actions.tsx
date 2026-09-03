"use client";

import { ToolStrip } from "./tool-strip";
import { useComposerStore } from "@/stores/composer-store";

/**
 * Welcome-screen "Quick actions" row — the same composer tools (Search, Code,
 * Image Gen, Research), surfaced as labelled pills. Toggling one pre-enables it
 * for the next conversation via the shared composer store.
 */
export function QuickActions() {
  const defaultTools = useComposerStore((s) => s.defaultTools);
  const toggleDefaultTool = useComposerStore((s) => s.toggleDefaultTool);

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
        Quick actions
      </span>
      <ToolStrip
        active={defaultTools}
        onToggle={toggleDefaultTool}
        variant="pill"
      />
    </div>
  );
}
