"use client";

import { Icon, Tabs, type TabItem } from "@/components/ui";
import { useUiStore, type ContextTab } from "@/stores/ui-store";
import { FilesTab } from "./files-tab";
import { SourcesTab } from "./sources-tab";
import { ToolsTab } from "./tools-tab";
import { ActivityTab } from "./activity-tab";

const TABS: (TabItem & { id: ContextTab })[] = [
  { id: "files", label: "Files", icon: "description" },
  { id: "sources", label: "Sources", icon: "menu_book" },
  { id: "tools", label: "Tools", icon: "construction" },
  { id: "activity", label: "Activity", icon: "analytics" },
];

export interface ContextPanelProps {
  /** stacked icon+label tabs for the mobile drawer */
  layout?: "inline" | "stacked";
  conversationId?: string;
  /** welcome state — no files/context attached yet */
  emptyContext?: boolean;
}

export function ContextPanel({
  layout = "inline",
  conversationId,
  emptyContext = false,
}: ContextPanelProps) {
  const contextTab = useUiStore((s) => s.contextTab);
  const setContextTab = useUiStore((s) => s.setContextTab);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-outline-variant p-4">
        <h2 className="text-sm font-bold text-on-surface">Intelligence</h2>
        <p className="mt-0.5 text-xs text-on-surface-variant">Context &amp; Tools</p>
      </div>

      <Tabs
        aria-label="Context panel"
        tabs={TABS}
        value={contextTab}
        onValueChange={(id) => setContextTab(id as ContextTab)}
        layout={layout}
      />

      <div
        role="tabpanel"
        aria-labelledby={`tab-${contextTab}`}
        className="min-h-0 flex-1 overflow-y-auto"
      >
        {contextTab === "files" ? <FilesTab empty={emptyContext} /> : null}
        {contextTab === "sources" ? <SourcesTab /> : null}
        {contextTab === "tools" ? (
          <ToolsTab conversationId={conversationId} />
        ) : null}
        {contextTab === "activity" ? <ActivityTab /> : null}
      </div>

      {emptyContext ? (
        <div className="border-t border-outline-variant p-4">
          <div className="rounded-lg border border-outline-variant bg-surface-container-low p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-on-surface">
              <Icon name="bolt" size={14} className="text-primary" />
              Tip
            </p>
            <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
              Add files, links, or tools to give Slime AI more context and better
              results.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
