"use client";

import { Card, Chip, Icon, IconButton } from "@/components/ui";
import { mockSources } from "@/data/context";

export function SourcesTab() {
  return (
    <div className="space-y-3 p-4">
      <h3 className="text-sm font-semibold text-on-surface">Data sources</h3>
      {mockSources.map((source) => (
        <Card key={source.id} className="flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-primary">
            <Icon name={source.icon} size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-on-surface">
              {source.title}
            </span>
            <span className="block text-xs text-on-surface-variant">
              {source.detail}
            </span>
          </span>
          {source.connected ? (
            <Chip tone="success" icon="check">
              Connected
            </Chip>
          ) : (
            <IconButton
              icon="add"
              label={`Connect ${source.title}`}
              size="sm"
            />
          )}
        </Card>
      ))}
    </div>
  );
}
