"use client";

import { Icon } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/format";
import { mockActivity } from "@/data/context";

export function ActivityTab() {
  return (
    <ol className="p-4">
      {mockActivity.map((event, index) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-variant text-primary">
              <Icon name={event.icon} size={16} />
            </span>
            {index < mockActivity.length - 1 ? (
              <span className="my-1 w-px flex-1 bg-outline-variant" />
            ) : null}
          </div>
          <div className="pb-5">
            <p className="text-sm font-medium text-on-surface">{event.title}</p>
            <p className="text-xs text-on-surface-variant">{event.detail}</p>
            <p className="mt-1 text-[11px] text-on-surface-variant/70">
              {formatRelativeTime(event.timestamp)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
