"use client";

import { Button, Card, EmptyState, Icon, IconButton } from "@/components/ui";
import { formatBytes } from "@/lib/utils/format";
import { mockFiles } from "@/data/context";

export function FilesTab({ empty = false }: { empty?: boolean }) {
  if (empty) {
    return (
      <EmptyState
        className="h-full"
        icon="description"
        title="No active context"
        description="Upload files or connect data sources to provide deeper context for Slime."
        action={
          <Button variant="outline" size="sm" iconLeft="hub">
            Connect Data
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface">Active Context</h3>
        <IconButton icon="upload" label="Upload file" size="sm" />
      </div>
      {mockFiles.map((file) => (
        <Card key={file.id} className="flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-primary">
            <Icon name="description" size={20} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-on-surface">
              {file.name}
            </span>
            <span className="block text-xs text-on-surface-variant">
              {formatBytes(file.size)}
            </span>
          </span>
          <IconButton icon="close" label={`Remove ${file.name}`} size="sm" />
        </Card>
      ))}
    </div>
  );
}
