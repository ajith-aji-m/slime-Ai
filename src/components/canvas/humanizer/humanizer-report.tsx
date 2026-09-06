"use client";

import { Icon } from "@/components/ui";
import { readingEaseLabel, detectorVerdictLabel } from "@/lib/humanizer";
import { cn } from "@/lib/utils/cn";
import type { HumanizerAnalysis, HumanizerDetectorEstimate } from "@/types/humanizer";

/**
 * Compact, content-writer-focused summary: how much changed, how many spans are
 * highlighted, keyword health, word-count delta and (when reliably scorable)
 * the readability shift.
 */
export function HumanizerReport({ analysis }: { analysis: HumanizerAnalysis }) {
  const { stats, readability, detector, voiceCheck } = analysis;
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

  if (detector) {
    tiles.push({
      label: "Detector pass",
      value: `${detector.original.score} → ${detector.humanized.score}`,
      hint: detectorVerdictLabel(detector.humanized.verdict),
      warn: detector.humanized.verdict === "likely-ai",
    });
  }

  tiles.push({
    label: "Voice",
    value: voiceCheck.count === 0 ? "Clear" : String(voiceCheck.count),
    hint:
      voiceCheck.count === 0
        ? "no we/our/us"
        : `${voiceCheck.found.join(", ")} found`,
    warn: voiceCheck.count > 0,
  });

  return (
    <div className="shrink-0 border-b border-glass-line bg-glass-fill px-3 py-3">
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

      {detector ? <DetectorDetail estimate={detector.humanized} /> : null}

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

      {voiceCheck.count > 0 ? (
        <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-error/30 bg-error/5 px-2.5 py-1.5 text-[11px] text-on-surface">
          <Icon name="close" size={13} className="mt-0.5 shrink-0 text-error" />
          <span>
            Still uses corporate &quot;we&quot; voice —{" "}
            <span className="font-semibold">{voiceCheck.found.join(", ")}</span>{" "}
            ({voiceCheck.count}×). Humanizer rewrites should avoid we/our/us.
          </span>
        </p>
      ) : null}
    </div>
  );
}

/**
 * Explains *why* the detector estimate landed where it did, and is explicit
 * that this is a local heuristic self-check, not a real AI-detector API —
 * the same "never fake a capability" rule as image gen/web search.
 */
function DetectorDetail({ estimate }: { estimate: HumanizerDetectorEstimate }) {
  if (estimate.signals.length === 0) {
    return (
      <p className="mt-2 flex items-start gap-1.5 rounded-lg border border-glass-line bg-glass-fill px-2.5 py-1.5 text-[11px] text-on-surface-variant">
        <Icon name="check_circle" size={13} className="mt-0.5 shrink-0 text-primary" />
        <span>No obvious AI-writing tells detected in the rewrite.</span>
      </p>
    );
  }

  const isAiLike = estimate.verdict === "likely-ai";
  return (
    <div
      className={cn(
        "mt-2 rounded-lg border px-2.5 py-1.5 text-[11px]",
        isAiLike
          ? "border-error/30 bg-error/5 text-on-surface"
          : "border-glass-line bg-glass-fill text-on-surface-variant",
      )}
    >
      <p className="flex items-center gap-1.5 font-medium">
        <Icon
          name={isAiLike ? "close" : "check_circle"}
          size={13}
          className={isAiLike ? "text-error" : "text-primary"}
        />
        Heuristic self-check, not a real detector call — signals found in the rewrite:
      </p>
      <ul className="mt-1 space-y-0.5 pl-[19px]">
        {estimate.signals.slice(0, 4).map((s) => (
          <li key={s.label}>
            {s.weight > 0 ? "+" : ""}
            {s.weight} {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
