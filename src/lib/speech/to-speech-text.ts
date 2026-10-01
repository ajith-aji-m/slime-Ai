import type { Message, MessagePart } from "@/types/chat";

/**
 * Strips Markdown syntax (and anything else not meant to be read
 * character-by-character) out of one chunk of raw prose. The assistant is
 * explicitly told to write Markdown (see `SYSTEM_PROMPT` in
 * `src/lib/ai/server/nvidia.ts`/`groq.ts`), so without this every reply gets
 * read as "asterisk asterisk bold asterisk asterisk", a bullet as "dash
 * item", a heading as "pound pound heading", a link as its full literal
 * URL, and so on — exactly the "spells out the symbols" complaint.
 */
function stripMarkdown(text: string): string {
  let out = text;

  // Fenced code blocks (multi-line) — reading raw source character-by-
  // character aloud is close to meaningless; announce it instead.
  out = out.replace(/```[^\n]*\n?[\s\S]*?```/g, " Code block. ");

  // Images — never "exclamation bracket alt text bracket paren url paren";
  // read the alt text (or say "Image.") and drop the URL.
  out = out.replace(/!\[([^\]]*)\]\([^)]*\)/g, (_m, alt: string) =>
    alt.trim() ? alt : " Image. ",
  );
  // Links — read the link text, drop the URL (reading a URL aloud — all
  // those slashes, dots, query strings — is its own kind of unreadable).
  out = out.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  // Inline code — keep the text, drop the backticks.
  out = out.replace(/`([^`]+)`/g, "$1");
  // Emphasis — ***bold italic***, then **bold**/__bold__, then */_ italic,
  // then ~~strikethrough~~. Longest markers first so a double doesn't get
  // partially consumed by the single-marker pattern below it.
  out = out.replace(/(\*\*\*|___)([^*_]+?)\1/g, "$2");
  out = out.replace(/(\*\*|__)([^*_]+?)\1/g, "$2");
  out = out.replace(/(\*|_)([^*_]+?)\1/g, "$2");
  out = out.replace(/~~([^~]+?)~~/g, "$1");

  // Everything below reads one line at a time. A line that a rule removes
  // entirely (a table's "|---|---|" separator row, a horizontal rule)
  // returns `null` and is filtered out below — not "", which would leave a
  // stray blank-line gap where it used to be.
  out = out
    .split("\n")
    .map((line): string | null => {
      // A Markdown table row — read the cell text, comma-separated,
      // instead of the pipe syntax.
      if (/^\s*\|.*\|\s*$/.test(line)) {
        const cells = line
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        if (cells.every((c) => /^:?-{2,}:?$/.test(c))) return null;
        return cells.join(", ");
      }
      let l = line;
      // Heading marker.
      l = l.replace(/^(\s*)#{1,6}\s+/, "$1");
      // Blockquote marker.
      l = l.replace(/^(\s*)>\s?/, "$1");
      // A horizontal rule — a line of only -/*/_ (3+), spaced or not.
      if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(l)) return null;
      // Bullet / numbered list marker — keep the item text.
      l = l.replace(/^(\s*)[-*+]\s+/, "$1");
      l = l.replace(/^(\s*)\d+[.)]\s+/, "$1");
      return l;
    })
    .filter((l): l is string => l !== null)
    .join("\n");

  // Any raw HTML that slipped through, and the whitespace all of the above
  // editing leaves behind.
  return out
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function partToSpeechText(part: MessagePart): string {
  switch (part.type) {
    case "text":
      return stripMarkdown(part.text);
    case "code":
      // A structured code part (no Markdown fence to strip — see
      // `messageToPlainText`) — same reasoning as the fenced-block case
      // above: read source aloud character-by-character helps no one.
      return " Code block. ";
    case "table":
      return stripMarkdown(part.markdown);
    case "tool_call":
      // Internal bookkeeping label ("Searching the web…") — nothing a
      // listener needs read aloud.
      return "";
    case "citation_group":
      return part.citations.length
        ? ` ${part.citations.length} source${part.citations.length === 1 ? "" : "s"} cited. `
        : "";
    case "image":
      return part.prompt ? ` Image: ${stripMarkdown(part.prompt)}. ` : " Image. ";
    default:
      return "";
  }
}

/**
 * Flattens a message to the text actually worth *speaking*. Unlike
 * `messageToPlainText` (used for copy-to-clipboard, where raw Markdown is
 * exactly what a paste target wants and must be preserved), this strips
 * Markdown syntax and anything else not meant to be read character-by-
 * character — fenced code, table pipe syntax, link URLs, heading/list/
 * emphasis markers — so SpeechSynthesis reads prose, not symbols.
 */
export function toSpeechText(message: Message): string {
  return message.parts
    .map((part) => partToSpeechText(part).trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
