"use client";

import { useMemo, useState } from "react";
import { EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { analyzeHumanization } from "@/lib/humanizer";
import type { CanvasArtifact } from "@/types/canvas";
import { HumanizedText } from "./humanizer/humanized-text";
import { HumanizerReport } from "./humanizer/humanizer-report";
import { KeywordList } from "./humanizer/keyword-list";

type Tab = "text" | "keywords";

/**
 * Canvas view for a Humanizer rewrite: the report strip, then either the
 * humanized text with highlighted changes or the detected keyword list. The
 * analysis is normally carried on the artifact (derived once by `detect.ts`);
 * it's recomputed here only as a fallback.
 */
export function HumanizerCanvas({ artifact }: { artifact: CanvasArtifact }) {
  const humanized = artifact.markdown ?? "";
  const original = artifact.originalText ?? "";

  const analysis = useMemo(
    () => artifact.humanizer ?? analyzeHumanization(original, humanized),
    [artifact.humanizer, original, humanized],
  );

  const [tab, setTab] = useState<Tab>("text");
  const [showHighlights, setShowHighlights] = useState(true);
  const [showRemoved, setShowRemoved] = useState(false);

  if (!humanized) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon="draw"
          title="Nothing to humanize yet"
          description="Enable Humanizer, paste AI-generated text, and send it."
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
      <HumanizerReport analysis={analysis} />

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <div className="flex gap-1" role="tablist" aria-label="Humanizer views">
          {(
            [
              ["text", "Humanized text"],
              ["keywords", `Keywords (${analysis.keywords.length})`],
            ] as [Tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-colors",
                tab === id
                  ? "bg-primary/15 text-primary"
                  : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "text" ? (
          <div className="flex gap-1.5">
            <Toggle
              label="Highlight"
              on={showHighlights}
              onClick={() => setShowHighlights((v) => !v)}
            />
            <Toggle
              label="Show removed"
              on={showRemoved}
              onClick={() => setShowRemoved((v) => !v)}
            />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "text" ? (
          <HumanizedText
            segments={analysis.segments}
            showHighlights={showHighlights}
            showRemoved={showRemoved}
          />
        ) : (
          <KeywordList keywords={analysis.keywords} />
        )}
      </div>
    </div>
  );
}

function Toggle({
  label,
  on,
  onClick,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        on
          ? "border-[var(--sl-mode-ring)] bg-primary/15 text-primary"
          : "border-white/15 text-on-surface-variant hover:text-on-surface",
      )}
    >
      {label}
    </button>
  );
}
