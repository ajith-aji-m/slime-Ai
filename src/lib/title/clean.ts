const MAX_TITLE_CHARS = 60;

/**
 * Normalizes a raw model reply into a usable conversation title. Models
 * reliably drift from an instruction like "reply with the title only" —
 * wrapping it in quotes, adding a trailing period, echoing a "Title:"
 * prefix, or answering on a second line — so this is defensive rather than
 * trusting the prompt alone.
 */
export function cleanGeneratedTitle(raw: string): string {
  let title = raw
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "";

  title = title.replace(/^(title|conversation title)\s*:\s*/i, "");
  title = title.trim().replace(/^['"“‘]+|['"”’]+$/g, "");
  title = title.replace(/[*_#`]/g, "");
  title = title.replace(/\s+/g, " ").trim();
  title = title.replace(/[.;:,]+$/, "").trim();

  if (title.length > MAX_TITLE_CHARS) {
    title = `${title.slice(0, MAX_TITLE_CHARS - 1).trimEnd()}…`;
  }

  return title;
}
