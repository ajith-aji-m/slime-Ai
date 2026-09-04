"use client";

import { Markdown } from "@/components/chat/markdown";
import type { CanvasArtifact } from "@/types/canvas";

/**
 * Document workspace for long, structured answers. Reuses the same Markdown
 * renderer the chat uses (headings, lists, tables, code, quotes, rules) inside a
 * comfortable reading measure.
 */
export function ReportCanvas({ artifact }: { artifact: CanvasArtifact }) {
  // The document title is shown in the header below, so drop a leading H1.
  const markdown = (artifact.markdown ?? "").replace(/^\s*#\s+.*\n+/, "");
  const words = artifact.meta?.words;

  return (
    <div className="h-full min-h-0 overflow-auto bg-surface-container-lowest">
      <article className="mx-auto max-w-[72ch] px-6 py-8 text-[15px] leading-relaxed text-on-surface">
        <header className="mb-6 border-b border-outline-variant pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">
            {artifact.title}
          </h1>
          {words ? (
            <p className="mt-1 text-xs text-on-surface-variant">{words} words</p>
          ) : null}
        </header>
        <Markdown text={markdown} />
      </article>
    </div>
  );
}
