"use client";

import { useState } from "react";
import { IconButton } from "@/components/ui";

export function MessageActions({
  onCopy,
  onRegenerate,
}: {
  onCopy: () => void;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <IconButton
        icon={copied ? "check" : "content_copy"}
        label="Copy response"
        size="sm"
        onClick={() => {
          onCopy();
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      />
      {onRegenerate ? (
        <IconButton
          icon="refresh"
          label="Regenerate response"
          size="sm"
          onClick={onRegenerate}
        />
      ) : null}
      <div className="mx-1 h-4 w-px bg-outline-variant" />
      <IconButton icon="thumb_up" label="Good response" size="sm" />
      <IconButton icon="thumb_down" label="Bad response" size="sm" />
    </div>
  );
}
