"use client";

import { Avatar, GlassPanel, Icon } from "@/components/ui";
import { site } from "@/config/site";
import { formatClockTime } from "@/lib/utils/format";
import { messageToPlainText } from "@/lib/utils/message-text";
import type { Message } from "@/types/chat";
import { MessageParts } from "./message-parts";
import { MessageActions } from "./message-actions";

export function AssistantMessage({
  message,
  onRegenerate,
  isLast,
  statusLabel,
}: {
  message: Message;
  onRegenerate?: () => void;
  isLast: boolean;
  /** transient internal-router status while this message streams */
  statusLabel?: string;
}) {
  const streaming = message.status === "streaming";
  const errored = message.status === "error";

  return (
    <div className="group flex gap-4">
      <Avatar
        name={site.assistantName}
        icon="psychology"
        brand
        size={40}
        className="mt-1"
      />
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-on-surface">
            {site.assistantName}
          </span>
          <span className="text-xs text-on-surface-variant">
            {formatClockTime(message.createdAt)}
          </span>
        </div>

        <GlassPanel className="rounded-tl-sm px-5 py-4">
          {message.parts.length === 0 && streaming ? (
            <span className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <Icon name="graphic_eq" size={16} className="animate-pulse" />
              {statusLabel ?? "Thinking…"}
            </span>
          ) : (
            <MessageParts parts={message.parts} />
          )}
          {streaming && message.parts.length > 0 ? (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
          ) : null}
        </GlassPanel>

        {!streaming ? (
          <MessageActions
            onCopy={() =>
              navigator.clipboard?.writeText(messageToPlainText(message))
            }
            onRegenerate={isLast || errored ? onRegenerate : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}
