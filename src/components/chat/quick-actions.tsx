"use client";

import { Icon } from "@/components/ui";
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
    <div className="flex flex-col items-center gap-2.5">
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-on-surface-variant">
        <Icon name="bolt" size={14} className="text-primary" />
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
