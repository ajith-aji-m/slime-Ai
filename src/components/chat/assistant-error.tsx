"use client";

import { Icon } from "@/components/ui";

/**
 * Contextual inline failure state shown beneath a response that couldn't be
 * completed. Deliberately quiet — no red banner, no toast, no technical detail.
 */
export function AssistantError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-[13px] text-on-surface-variant">
      <span className="flex min-w-0 items-center gap-1.5">
        <Icon name="refresh" size={15} className="shrink-0 text-on-surface-variant" />
        <span className="min-w-0">{message}</span>
      </span>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="ml-auto shrink-0 rounded-md px-2 py-1 text-[13px] font-semibold text-primary transition-colors hover:bg-primary/10"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}
