"use client";

import { Icon } from "@/components/ui";
import { formatBytes } from "@/lib/utils/format";
import { isImageAttachment } from "@/lib/utils/file";
import type { Attachment } from "@/types/chat";

/**
 * One attachment, shown either as a staged (removable) chip in the composer
 * or a plain chip on a sent message. Images get a thumbnail; everything else
 * gets a file icon.
 */
export function AttachmentChip({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  /** omit to render as read-only (sent message) */
  onRemove?: () => void;
}) {
  const image = isImageAttachment(attachment) && attachment.url;

  return (
    <span className="liquid-inner flex max-w-[180px] items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2.5 text-xs sm:max-w-[220px]">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element -- local data: URL thumbnail, not a remote asset
        <img
          src={attachment.url}
          alt=""
          className="h-7 w-7 shrink-0 rounded-lg object-cover"
        />
      ) : (
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-glass-fill text-primary">
          <Icon name="description" size={15} />
        </span>
      )}
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-medium text-on-surface">
          {attachment.name}
        </span>
        <span className="block text-[10px] text-on-surface-variant">
          {formatBytes(attachment.size)}
        </span>
      </span>
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${attachment.name}`}
          onClick={onRemove}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:bg-glass-hover hover:text-on-surface sm:h-5 sm:w-5"
        >
          <Icon name="close" size={13} />
        </button>
      ) : null}
    </span>
  );
}
