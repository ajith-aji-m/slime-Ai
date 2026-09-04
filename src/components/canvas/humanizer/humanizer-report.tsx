"use client";

import { Icon } from "@/components/ui";
import { readingEaseLabel } from "@/lib/humanizer";
import type { HumanizerAnalysis } from "@/types/humanizer";

/**
 * Compact, content-writer-focused summary: how much changed, how many spans are
 * highlighted, keyword health, word-count delta and (when reliably scorable)
 * the readability shift.
 */
export function HumanizerReport({ analysis }: { analysis: HumanizerAnalysis }) {
  const { stats, readability } = analysis;
  const dropped = analysis.droppedKeywords.length;

  const tiles: { label: string; value: string; hint?: string; warn?: boolean }[] = [
    { label: "Changes", value: String(analysis.changeCount) },
    { label: "Highlighted", value: String(analysis.highlightCount) },
    {
      label: "Keywords",
      value: String(analysis.keywords.length),
      hint: dropped > 0 ? `${dropped} to check` : "all kept",
      warn: dropped > 0,
    },
    {
      label: "Words",
      value: `${stats.originalWords} → ${stats.humanizedWords}`,
      hint:
        stats.wordDeltaPct === 0
          ? "no change"
          : `${stats.wordDeltaPct > 0 ? "+" : ""}${stats.wordDeltaPct}%`,
    },
  ];

  if (readability) {
    tiles.push({
      label: "Reading ease",
      value: `${readability.original.readingEase} → ${readability.humanized.readingEase}`,
      hint: readingEaseLabel(readability.humanized.readingEase),
    });
    tiles.push({
      label: "Grade level",
      value: `${readability.original.gradeLevel} → ${readability.humanized.gradeLevel}`,
    });
  }

  return (
    <div className="shrink-0 border-b border-white/10 bg-white/[0.03] px-3 py-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div
            key={tile.label}
            className="liquid-inner rounded-xl px-3 py-2"
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
              {tile.label}
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-on-surface">
              {tile.value}
            </p>
            {tile.hint ? (
              <p
                className={
                  tile.warn
                    ? "mt-0.5 flex items-center gap-1 text-[11px] font-medium text-error"
                    : "mt-0.5 text-[11px] text-on-surface-variant"
                }
              >
                {tile.warn ? <Icon name="close" size={11} /> : null}
                {tile.hint}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {dropped > 0 ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-error/30 bg-error/5 px-2.5 py-1.5 text-[11px] text-on-surface">
          <Icon name="close" size={13} className="mt-0.5 shrink-0 text-error" />
          <span>
            Possibly dropped in the rewrite:{" "}
            <span className="font-semibold">
              {analysis.droppedKeywords.join(", ")}
            </span>
            . Check these before publishing.
          </span>
        </p>
      ) : null}
    </div>
  );
}
