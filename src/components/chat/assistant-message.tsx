"use client";

import { SlimeMark } from "@/components/ui";
import { site } from "@/config/site";
import { formatClockTime } from "@/lib/utils/format";
import { messageToPlainText } from "@/lib/utils/message-text";
import type { Message } from "@/types/chat";
import { MessageParts } from "./message-parts";
import { MessageActions } from "./message-actions";
import { AssistantError } from "./assistant-error";
import { SlimeThinking } from "./slime-thinking";
import { useAssistantArtifacts } from "@/components/canvas/use-assistant-artifacts";

export function AssistantMessage({
  message,
  conversationId,
  onRegenerate,
  isLast,
  statusLabel,
}: {
  message: Message;
  conversationId: string;
  onRegenerate?: () => void;
  isLast: boolean;
  /** transient internal-router status while this message streams */
  statusLabel?: string;
}) {
  const streaming = message.status === "streaming";
  const errored = message.status === "error";
  const hasContent = message.parts.length > 0;
  const displayParts = useAssistantArtifacts(message, conversationId, isLast);

  return (
    <div className="group flex gap-4">
      <span className="liquid-inner mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <SlimeMark size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-on-surface">
            {site.assistantName}
          </span>
          <span className="text-xs text-on-surface-variant">
            {formatClockTime(message.createdAt)}
          </span>
        </div>

        {(hasContent || streaming) && !(errored && !hasContent) ? (
          <div className="liquid-inner rounded-2xl rounded-tl-sm px-5 py-4">
            {!hasContent && streaming ? (
              <SlimeThinking label={statusLabel ?? "Thinking…"} />
            ) : (
              <MessageParts parts={displayParts} />
            )}
            {streaming && hasContent ? (
              <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
            ) : null}
          </div>
        ) : null}

        {errored && message.error ? (
          <AssistantError
            message={message.error}
            onRetry={
              message.recoverable !== false ? onRegenerate : undefined
            }
          />
        ) : null}

        {!streaming && !errored ? (
          <MessageActions
            messageId={message.id}
            speechText={hasContent ? messageToPlainText(message) : undefined}
            onCopy={() =>
              navigator.clipboard?.writeText(messageToPlainText(message))
            }
            onRegenerate={isLast ? onRegenerate : undefined}
          />
        ) : null}
      </div>
    </div>
  );
}
