"use client";

import { useRef, useState } from "react";
import { Button, Card, EmptyState, Icon, IconButton } from "@/components/ui";
import { formatBytes } from "@/lib/utils/format";
import { fileToAttachment, AttachmentTooLargeError } from "@/lib/utils/file";
import { useConversationStore } from "@/stores/conversation-store";
import type { Attachment } from "@/types/chat";

/** One conversation attachment, plus which message it came from. */
interface ContextFile {
  attachment: Attachment;
  messageId: string;
  addedAt: string;
}

export function FilesTab({
  conversationId,
  empty = false,
}: {
  conversationId?: string;
  empty?: boolean;
}) {
  const conversation = useConversationStore((s) =>
    conversationId ? s.conversations[conversationId] : undefined,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const files: ContextFile[] = (conversation?.messages ?? []).flatMap((m) =>
    (m.attachments ?? []).map((attachment) => ({
      attachment,
      messageId: m.id,
      addedAt: m.createdAt,
    })),
  );

  async function handleUpload(fileList: FileList | null) {
    if (!fileList || fileList.length === 0 || !conversationId || !conversation)
      return;
    setError(null);
    const attachments: Attachment[] = [];
    for (const file of Array.from(fileList)) {
      try {
        attachments.push(await fileToAttachment(file));
      } catch (err) {
        setError(
          err instanceof AttachmentTooLargeError
            ? err.message
            : `Couldn't read "${file.name}".`,
        );
      }
    }
    if (attachments.length) {
      await useConversationStore
        .getState()
        .sendMessage(conversationId, "", { tools: conversation.tools, attachments });
    }
  }

  if (empty || (conversationId && files.length === 0)) {
    return (
      <EmptyState
        className="h-full"
        icon="folder_open"
        title="No active context"
        description={
          conversationId
            ? "Upload a file to give Slime more context for this chat."
            : "Upload files or connect data sources to provide deeper context for Slime."
        }
        action={
          conversationId ? (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  void handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
              <Button
                variant="outline"
                size="sm"
                iconLeft="upload"
                className="rounded-full text-primary"
                onClick={() => fileInputRef.current?.click()}
              >
                Upload file
              </Button>
              {error ? (
                <p className="mt-2 text-xs text-error">{error}</p>
              ) : null}
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              iconLeft="hub"
              className="rounded-full text-primary"
            >
              Connect Data
            </Button>
          )
        }
      />
    );
  }

  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-on-surface">Active Context</h3>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="sr-only"
          onChange={(e) => {
            void handleUpload(e.target.files);
            e.target.value = "";
          }}
        />
        <IconButton
          icon="upload"
          label="Upload file"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        />
      </div>
      {error ? <p className="text-xs text-error">{error}</p> : null}
      {files.map(({ attachment }) => (
        <Card key={attachment.id} className="flex items-center gap-3 p-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-variant text-primary">
            <Icon
              name={attachment.mimeType.startsWith("image/") ? "image" : "description"}
              size={20}
            />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-on-surface">
              {attachment.name}
            </span>
            <span className="block text-xs text-on-surface-variant">
              {formatBytes(attachment.size)}
            </span>
          </span>
        </Card>
      ))}
    </div>
  );
}
