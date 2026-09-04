export type ColumnAlign = "left" | "center" | "right";

export interface ParsedTable {
  headers: string[];
  align: ColumnAlign[];
  rows: string[][];
}

function splitRow(row: string): string[] {
  return row
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

/** Parse a GitHub-flavoured Markdown table, including column alignment. */
export function parseMarkdownTable(markdown: string): ParsedTable | null {
  const lines = markdown.trim().split("\n").filter((l) => l.includes("|"));
  if (lines.length < 2) return null;
  const headers = splitRow(lines[0]);
  const align: ColumnAlign[] = splitRow(lines[1]).map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return "left";
  });
  const rows = lines.slice(2).map(splitRow);
  return { headers, align, rows };
}

export function tableToCsv(table: ParsedTable): string {
  const escape = (value: string) => {
    const plain = value.replace(/\*\*/g, "").trim();
    return /[",\n]/.test(plain) ? `"${plain.replace(/"/g, '""')}"` : plain;
  };
  return [table.headers, ...table.rows]
    .map((row) => row.map(escape).join(","))
    .join("\n");
}
