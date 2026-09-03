"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { highlight } from "@/lib/code/highlight";
import { useCanvasStore } from "@/stores/canvas-store";
import type { CanvasArtifact } from "@/types/canvas";

/**
 * Rendered HTML preview for Canvas. The markup runs inside a fully sandboxed
 * iframe — `sandbox` with no `allow-scripts`, so scripts, forms, popups and
 * same-origin access are all blocked. A source view and a re-render action sit
 * alongside.
 */
export function HtmlCanvas({ artifact }: { artifact: CanvasArtifact }) {
  const html = artifact.html ?? artifact.code ?? "";
  const view = useCanvasStore((s) => s.view);
  const setView = useCanvasStore((s) => s.setView);
  const [renderKey, setRenderKey] = useState(0);
  const tokens = useMemo(() => highlight(html, "html"), [html]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-outline-variant px-3 py-2">
        <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-0.5 text-xs font-semibold">
          {(["preview", "source"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={cn(
                "rounded-md px-2.5 py-1 capitalize transition-colors",
                view === v
                  ? "bg-surface-container-lowest text-on-surface shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {v}
            </button>
          ))}
        </div>
        {view === "preview" ? (
          <button
            type="button"
            onClick={() => setRenderKey((k) => k + 1)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-primary"
          >
            <Icon name="refresh" size={14} />
            Re-render
          </button>
        ) : null}
      </div>

      {view === "preview" ? (
        <iframe
          key={renderKey}
          title={`${artifact.title} preview`}
          sandbox=""
          referrerPolicy="no-referrer"
          className="min-h-0 flex-1 bg-white"
          srcDoc={html}
        />
      ) : (
        <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[13px] leading-relaxed text-on-surface">
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
      )}
    </div>
  );
}
