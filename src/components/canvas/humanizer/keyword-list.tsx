"use client";

import { Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import type { HumanizerKeyword, HumanizerKeywordKind } from "@/types/humanizer";

const KIND_LABEL: Record<HumanizerKeywordKind, string> = {
  entity: "Name / brand",
  number: "Figure",
  citation: "Citation",
  term: "Domain term",
};

/**
 * The important keywords detected in the user's original text, shown separately
 * so a content writer can confirm each one survived the rewrite. A crossed-out
 * chip means the term no longer appears in the humanized output.
 */
export function KeywordList({ keywords }: { keywords: HumanizerKeyword[] }) {
  if (keywords.length === 0) {
    return (
      <div className="mx-auto max-w-[68ch] px-6 py-8 text-sm text-on-surface-variant">
        No standout keywords were detected in the original text.
      </div>
    );
  }

  const groups = (["citation", "number", "entity", "term"] as HumanizerKeywordKind[])
    .map((kind) => ({ kind, items: keywords.filter((k) => k.kind === kind) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto max-w-[68ch] px-6 py-8">
      <p className="mb-4 text-sm text-on-surface-variant">
        Detected in your original text — verify each one is still present and
        correct in the humanized version.
      </p>

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <div key={group.kind}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant/70">
              {KIND_LABEL[group.kind]}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {group.items.map((kw) => (
                <span
                  key={`${kw.kind}:${kw.text}`}
                  title={
                    kw.preserved
                      ? `Kept · appears ${kw.count}× in the original`
                      : "Not found in the humanized text"
                  }
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium",
                    kw.preserved
                      ? "border-glass-line bg-glass-fill text-on-surface"
                      : "border-error/40 bg-error/5 text-on-surface line-through decoration-error/60",
                  )}
                >
                  <Icon
                    name={kw.preserved ? "check" : "close"}
                    size={12}
                    className={kw.preserved ? "text-success" : "text-error"}
                  />
                  {kw.text}
                  {kw.count > 1 ? (
                    <span className="text-on-surface-variant/70">×{kw.count}</span>
                  ) : null}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
