"use client";

import { useMemo, useState } from "react";
import { Chip, Icon } from "@/components/ui";
import { cn } from "@/lib/utils/cn";
import { parseMarkdownTable, type ColumnAlign } from "@/lib/canvas/table";
import type { CanvasArtifact } from "@/types/canvas";

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  "on target": "success",
  exceeding: "success",
  stable: "neutral",
  "review needed": "warning",
  "at risk": "danger",
};

const ALIGN_CLASS: Record<ColumnAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function Cell({ value }: { value: string }) {
  const plain = value.replace(/\*\*/g, "").trim();
  const tone = STATUS_TONE[plain.toLowerCase()];
  if (tone) return <Chip tone={tone}>{plain}</Chip>;
  if (/^[+-]\d/.test(plain)) {
    return (
      <span className={cn("font-medium", plain.startsWith("-") ? "text-error" : "text-success")}>
        {plain}
      </span>
    );
  }
  const bold = /^\*\*.*\*\*$/.test(value);
  return <span className={bold ? "font-semibold text-on-surface" : undefined}>{plain}</span>;
}

/** Full data table for Canvas, with a client-side row filter. */
export function TableCanvas({ artifact }: { artifact: CanvasArtifact }) {
  const table = useMemo(
    () => parseMarkdownTable(artifact.markdown ?? ""),
    [artifact.markdown],
  );
  const [query, setQuery] = useState("");

  if (!table) {
    return (
      <div className="p-6 text-sm text-on-surface-variant">
        This table couldn&apos;t be parsed.
      </div>
    );
  }

  const q = query.trim().toLowerCase();
  const rows = q
    ? table.rows.filter((row) => row.some((c) => c.toLowerCase().includes(q)))
    : table.rows;

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-container-lowest">
      <div className="flex shrink-0 items-center gap-2 border-b border-outline-variant px-4 py-2.5">
        <Icon name="search" size={16} className="text-on-surface-variant" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter rows…"
          className="flex-1 bg-transparent text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
        />
        <span className="shrink-0 text-xs text-on-surface-variant">
          {rows.length} / {table.rows.length}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-container-high">
              {table.headers.map((h, i) => (
                <th
                  key={i}
                  className={cn(
                    "border border-outline-variant px-4 py-3 font-semibold text-on-surface",
                    ALIGN_CLASS[table.align[i] ?? "left"],
                  )}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, ri) => (
              <tr key={ri} className={ri % 2 ? "bg-surface-container-low/40" : undefined}>
                {cells.map((c, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "border border-outline-variant px-4 py-3 text-on-surface-variant",
                      ALIGN_CLASS[table.align[ci] ?? "left"],
                    )}
                  >
                    <Cell value={c} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="p-6 text-center text-sm text-on-surface-variant">
            No rows match “{query}”.
          </p>
        ) : null}
      </div>
    </div>
  );
}
