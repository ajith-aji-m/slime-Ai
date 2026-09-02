"use client";

import { useState } from "react";
import { Button, IconButton } from "@/components/ui";
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
      <div className="max-w-[80%] rounded-2xl rounded-tr-sm border border-outline-variant bg-surface-container-high px-5 py-3.5 text-[15px] leading-relaxed text-on-surface shadow-ambient">
        <p className="whitespace-pre-wrap">{text}</p>
        <div className="mt-1 flex justify-end opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
