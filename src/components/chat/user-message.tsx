"use client";

import { useState } from "react";
import { Button, IconButton } from "@/components/ui";
import { AttachmentChip } from "./attachment-chip";
import type { Message } from "@/types/chat";

export function UserMessage({
  message,
  onEdit,
}: {
  message: Message;
  onEdit: (text: string) => void;
}) {
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);

  if (editing) {
    return (
      <div className="group flex justify-end">
        <div className="w-full max-w-[80%] rounded-2xl rounded-tr-sm border border-outline-variant bg-surface-container-high p-3">
          <textarea
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            className="sl-field resize-none text-[15px]"
          />
          <div className="mt-2 flex justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(text);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (draft.trim()) onEdit(draft.trim());
                setEditing(false);
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-[var(--sl-mode-ring)] bg-[color-mix(in_srgb,var(--sl-primary)_20%,transparent)] px-5 py-3.5 text-[15px] leading-relaxed text-on-surface shadow-[0_8px_24px_-8px_var(--sl-mode-glow)]">
        {message.attachments?.length ? (
          <div className="mb-2 flex flex-wrap justify-end gap-1.5">
            {message.attachments.map((attachment) => (
              <AttachmentChip key={attachment.id} attachment={attachment} />
            ))}
          </div>
        ) : null}
        {text ? <p className="whitespace-pre-wrap">{text}</p> : null}
        <div className="mt-1 flex justify-end opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
          <IconButton
            icon="edit"
            label="Edit message"
            size="sm"
            onClick={() => {
              setDraft(text);
              setEditing(true);
            }}
          />
        </div>
      </div>
    </div>
  );
}
