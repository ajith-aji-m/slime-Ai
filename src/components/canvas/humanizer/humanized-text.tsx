"use client";

import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { HumanizerDiffSegment } from "@/types/humanizer";

/**
 * The humanized text itself, with the *actual* changed wording highlighted —
 * every mark is an `insert` span from the word-level diff, never a random pick.
 * Removed wording can be shown inline for a full before/after comparison.
 */
export function HumanizedText({
  segments,
  showHighlights,
  showRemoved,
}: {
  segments: HumanizerDiffSegment[];
  showHighlights: boolean;
  showRemoved: boolean;
}) {
  return (
    <div className="mx-auto max-w-[68ch] px-6 py-8">
      <div className="mb-5 flex items-center gap-2 text-sm font-semibold text-primary">
        <Icon name="check_circle" size={18} filled />
        This content has been humanized
      </div>

      <p
        className="whitespace-pre-wrap text-[15px] leading-[1.9] text-on-surface"
        aria-label="Humanized text with changes highlighted"
      >
        {segments.map((seg, i) => {
          if (seg.type === "equal") {
            return <span key={i}>{seg.text}</span>;
          }
          if (seg.type === "insert") {
            return showHighlights ? (
              <mark
                key={i}
                className="rounded bg-[color-mix(in_srgb,var(--sl-primary)_26%,transparent)] px-0.5 text-on-surface box-decoration-clone"
              >
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            );
          }
          // delete
          return showRemoved ? (
            <del key={i} className="text-on-surface-variant/45 line-through">
              {seg.text}
            </del>
          ) : null;
        })}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/10 pt-4 text-[11px] text-on-surface-variant">
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block h-3 w-4 rounded-sm",
              "bg-[color-mix(in_srgb,var(--sl-primary)_26%,transparent)]",
            )}
          />
          New / rewritten wording
        </span>
        {showRemoved ? (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-3 w-4 rounded-sm border border-error/40 line-through" />
            Removed wording
          </span>
        ) : null}
      </div>
    </div>
  );
}
