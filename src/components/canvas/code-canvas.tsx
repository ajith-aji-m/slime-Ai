"use client";

import { useMemo } from "react";
import { highlight } from "@/lib/code/highlight";
import type { CanvasArtifact } from "@/types/canvas";

/**
 * Full code view for Canvas: whole-file syntax highlighting, a line-number
 * gutter and a horizontal scroll region. Copy / export live in the Canvas
 * header.
 */
export function CodeCanvas({ artifact }: { artifact: CanvasArtifact }) {
  const code = artifact.code ?? "";
  const tokens = useMemo(
    () => highlight(code, artifact.language ?? "text"),
    [code, artifact.language],
  );
  const lineCount = code.split("\n").length;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
      <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant px-4 py-2 text-xs text-on-surface-variant">
        <span className="font-mono">{artifact.language || "text"}</span>
        <span aria-hidden>·</span>
        <span>{lineCount} lines</span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <div className="flex min-w-full text-[13px] leading-relaxed">
          <pre
            aria-hidden
            className="shrink-0 select-none border-r border-outline-variant bg-surface-container-low px-3 py-4 text-right font-mono text-on-surface-variant/60"
          >
            {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
          </pre>
          <pre className="flex-1 overflow-x-auto px-4 py-4 font-mono text-on-surface">
            <code>
              {tokens.map((token, i) =>
                token.type === "plain" ? (
                  token.text
                ) : (
                  <span key={i} className={`hl-${token.type}`}>
                    {token.text}
                  </span>
                ),
              )}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
}
