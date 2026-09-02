import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Card, Icon } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/format";
import { mockActivity } from "@/data/context";

export const metadata: Metadata = { title: "Activity" };

export default function ActivityPage() {
  return (
    <WorkspacePage
      title="AI Activity"
      description="Model calls, tool runs and file events across the workspace."
    >
      <Card className="p-2">
        <ol className="divide-y divide-outline-variant">
          {mockActivity.map((event) => (
            <li key={event.id} className="flex items-start gap-3 p-3">
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant text-primary">
                <Icon name={event.icon} size={16} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium text-on-surface">
                  {event.title}
                </p>
                <p className="text-xs text-on-surface-variant">{event.detail}</p>
              </div>
              <span className="text-[11px] text-on-surface-variant/70">
                {formatRelativeTime(event.timestamp)}
              </span>
            </li>
          ))}
        </ol>
      </Card>
    </WorkspacePage>
  );
}
