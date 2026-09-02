import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Button, Card, Chip, Icon } from "@/components/ui";
import { formatBytes, formatRelativeTime } from "@/lib/utils/format";
import { mockFiles } from "@/data/context";

export const metadata: Metadata = { title: "Files" };

export default function FilesPage() {
  return (
    <WorkspacePage
      title="Files"
      description="Documents available as context across conversations and agents."
      actions={
        <Button size="sm" iconLeft="upload">
          Upload
        </Button>
      }
      width="wide"
    >
      <Card className="divide-y divide-outline-variant">
        {mockFiles.map((file) => (
          <div key={file.id} className="flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-primary">
              <Icon name="description" size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-on-surface">
                {file.name}
              </p>
              <p className="text-xs text-on-surface-variant">
                {formatBytes(file.size)} · added {formatRelativeTime(file.addedAt)}
              </p>
            </div>
            <Chip tone={file.status === "ready" ? "success" : "neutral"}>
              {file.status}
            </Chip>
          </div>
        ))}
      </Card>
    </WorkspacePage>
  );
}
