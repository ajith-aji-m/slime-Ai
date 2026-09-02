import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Button, Card, Chip, Icon } from "@/components/ui";
import { mockSources } from "@/data/context";

export const metadata: Metadata = { title: "Sources" };

export default function SourcesPage() {
  return (
    <WorkspacePage
      title="Sources"
      description="Connect data sources for retrieval and citations."
      width="wide"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {mockSources.map((source) => (
          <Card key={source.id} className="p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-primary">
                <Icon name={source.icon} size={20} />
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-on-surface">
                  {source.title}
                </h3>
                <p className="text-xs text-on-surface-variant">{source.detail}</p>
              </div>
            </div>
            <div className="mt-4">
              {source.connected ? (
                <Chip tone="success" icon="check">
                  Connected
                </Chip>
              ) : (
                <Button size="sm" variant="outline" iconLeft="add">
                  Connect
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </WorkspacePage>
  );
}
