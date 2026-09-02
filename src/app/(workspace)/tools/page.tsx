import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Card, Chip, Icon } from "@/components/ui";
import { tools } from "@/config/tools";

export const metadata: Metadata = { title: "Tools" };

export default function ToolsPage() {
  return (
    <WorkspacePage
      title="Capabilities"
      description="Tools the assistant can call. Enable them per conversation from the composer."
      width="wide"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => (
          <Card key={tool.id} className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-container/15 text-primary">
                <Icon name={tool.icon} size={20} />
              </span>
              <div className="flex-1">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-on-surface">
                  {tool.label}
                  {tool.inComposer ? null : <Chip>Automatic</Chip>}
                </h3>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {tool.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </WorkspacePage>
  );
}
