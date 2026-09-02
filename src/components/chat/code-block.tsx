"use client";

import { useState } from "react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

/**
 * Code block with a language header + copy button — matches the exported
 * AI-response code panel. Syntax highlighting is intentionally deferred; a
 * lazy-loaded highlighter (Shiki) can wrap `<pre>` later without API changes.
 */
export function CodeBlock({
  code,
  language,
  filename,
}: {
  code: string;
  language: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="group/code relative my-3 overflow-hidden rounded-lg border border-outline-variant">
      <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-high px-4 py-2">
        <span className="font-mono text-xs text-on-surface-variant">
          {filename ?? language}
        </span>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            "text-on-surface-variant hover:bg-surface-variant hover:text-primary",
          )}
        >
          <Icon name={copied ? "check" : "content_copy"} size={14} />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-surface-container-low p-4 text-[13px] leading-relaxed">
        <code className="font-mono text-on-surface">{code}</code>
      </pre>
    </div>
  );
}
