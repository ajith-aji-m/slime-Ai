import { Chip } from "@/components/ui";
import { cn } from "@/lib/utils/cn";

function splitRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "neutral"> = {
  "on target": "success",
  exceeding: "success",
  stable: "neutral",
  "review needed": "warning",
  "at risk": "danger",
};

function Cell({ value }: { value: string }) {
  const plain = value.replace(/\*\*/g, "");
  const tone = STATUS_TONE[plain.toLowerCase()];
  if (tone) return <Chip tone={tone}>{plain}</Chip>;
  if (/^[+-]\d/.test(plain)) {
    return (
      <span
        className={cn(
          "font-medium",
          plain.startsWith("-") ? "text-error" : "text-success",
        )}
      >
        {plain}
      </span>
    );
  }
  const bold = /^\*\*.*\*\*$/.test(value);
  return <span className={bold ? "font-semibold text-on-surface" : undefined}>{plain}</span>;
}

/** Renders a GFM table string (assistant "table" message part). */
export function MarkdownTable({ markdown }: { markdown: string }) {
  const rows = markdown.trim().split("\n").filter(Boolean);
  if (rows.length < 2) return null;
  const headers = splitRow(rows[0]);
  const bodyRows = rows.slice(2).map(splitRow);

  return (
    <div className="my-4 overflow-x-auto rounded-lg border border-outline-variant">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-surface-container-high">
            {headers.map((h) => (
              <th
                key={h}
                className="border border-outline-variant px-4 py-3 text-left font-semibold text-on-surface"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((cells, ri) => (
            <tr key={ri} className={ri % 2 ? "bg-surface-container-low/40" : undefined}>
              {cells.map((c, ci) => (
                <td
                  key={ci}
                  className="border border-outline-variant px-4 py-3 text-on-surface-variant"
                >
                  <Cell value={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
