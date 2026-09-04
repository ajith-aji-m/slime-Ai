import type { Message, MessagePart } from "@/types/chat";
import type {
  CanvasArtifact,
  CanvasArtifactRef,
  CanvasArtifactType,
} from "@/types/canvas";
import { analyzeHumanization } from "@/lib/humanizer";

/**
 * A chat-thread display part. Same shape as a stored `MessagePart`, plus a
 * synthetic `canvas_ref` that renders as a compact "Open in Canvas" card in
 * place of a large artifact.
 */
export type DisplayPart =
  | MessagePart
  | { type: "canvas_ref"; artifact: CanvasArtifactRef };

export interface MessageDisplayPlan {
  displayParts: DisplayPart[];
  artifacts: CanvasArtifact[];
}

/** Extra context the caller can supply to steer derivation. */
export interface PlanContext {
  /**
   * When set, the assistant message is a Humanizer rewrite of this text: the
   * whole answer becomes a single `humanizer` artifact (with the diff, keyword
   * check and readability) instead of going through normal artifact detection.
   */
  humanizerOriginal?: string;
}

const HUMANIZER_TEASER =
  "Your text has been rewritten to sound more natural. Open Canvas to review every change, the keywords, and the readability.";

/** Flatten the assistant's text parts into one string (the humanized output). */
function assistantText(message: Message): string {
  return message.parts
    .filter((p): p is Extract<MessagePart, { type: "text" }> => p.type === "text")
    .map((p) => p.text)
    .join("\n\n")
    .trim();
}

function planHumanizerDisplay(
  message: Message,
  original: string,
): MessageDisplayPlan {
  const humanized = assistantText(message);
  if (!humanized) return { displayParts: message.parts, artifacts: [] };

  const analysis = analyzeHumanization(original, humanized);
  const id = `${message.id}:humanizer`;
  const artifact: CanvasArtifact = {
    id,
    type: "humanizer",
    title: "Humanized text",
    conversationId: "",
    messageId: message.id,
    createdAt: message.createdAt,
    markdown: humanized,
    originalText: original,
    humanizer: analysis,
    meta: {
      changes: analysis.changeCount,
      highlights: analysis.highlightCount,
      keywords: analysis.keywords.length,
    },
  };

  const subtitleBits = [
    `${analysis.changeCount} ${analysis.changeCount === 1 ? "change" : "changes"}`,
    `${analysis.keywords.length} ${analysis.keywords.length === 1 ? "keyword" : "keywords"}`,
  ];
  if (analysis.droppedKeywords.length > 0) {
    subtitleBits.push(`${analysis.droppedKeywords.length} to check`);
  }

  return {
    displayParts: [
      {
        type: "canvas_ref",
        artifact: {
          id,
          type: "humanizer",
          title: "Humanized text",
          subtitle: subtitleBits.join(" · "),
          teaser: HUMANIZER_TEASER,
        },
      },
    ],
    artifacts: [artifact],
  };
}

const HTML_LANGS = new Set(["html", "htm", "xml", "svg", "xhtml"]);

/** A fenced block this big is worth its own Canvas rather than inline chat. */
const CODE_MIN_LINES = 5;
const CODE_MIN_CHARS = 240;
/** A Markdown table with at least this many body rows moves to Canvas. */
const TABLE_MIN_BODY_ROWS = 3;
/** A prose answer with structure this heavy becomes a report document. */
const REPORT_MIN_HEADINGS = 2;
const REPORT_MIN_CHARS = 700;

interface Segment {
  kind: "code" | "prose";
  lang: string;
  text: string;
}

/** Split on ``` fences, tolerating an unclosed trailing fence. */
function splitFences(input: string): Segment[] {
  const out: Segment[] = [];
  const fence = /(^|\n)```([^\n`]*)\n([\s\S]*?)(?:\n```(?=\n|$)|$)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = fence.exec(input)) !== null) {
    const start = match.index + match[1].length;
    if (start > last) out.push({ kind: "prose", lang: "", text: input.slice(last, start) });
    out.push({ kind: "code", lang: match[2].trim(), text: match[3].replace(/\n$/, "") });
    last = fence.lastIndex;
  }
  if (last < input.length) out.push({ kind: "prose", lang: "", text: input.slice(last) });
  return out;
}

function isSubstantialCode(code: string): boolean {
  return code.split("\n").length >= CODE_MIN_LINES || code.length >= CODE_MIN_CHARS;
}

function countHeadings(text: string): number {
  return (text.match(/^#{1,6}\s+\S/gm) ?? []).length;
}

/** Section headings (h2+) — a lone `#` title doesn't make a document. */
function countSectionHeadings(text: string): number {
  return (text.match(/^#{2,6}\s+\S/gm) ?? []).length;
}

function tableBodyRows(markdown: string): number {
  const rows = markdown.trim().split("\n").filter((r) => r.includes("|"));
  // header + separator + body
  return Math.max(0, rows.length - 2);
}

/** Pull the leading, non-heading paragraph from a report as the chat teaser. */
function reportTeaser(text: string, title: string): string {
  const stripped = text.replace(/```[\s\S]*?```/g, " ");
  for (const block of stripped.split(/\n{2,}/)) {
    const t = block.trim().replace(/\s+/g, " ");
    if (!t || /^#{1,6}\s/.test(t) || /^[-*|>]/.test(t)) continue;
    return t.length > 240 ? `${t.slice(0, 237)}…` : t;
  }
  return `${title} is ready in Canvas.`;
}

function reportTitle(text: string): string {
  const h1 = text.match(/^#{1,3}\s+(.+)$/m);
  if (h1) return h1[1].replace(/[#*`]/g, "").trim().slice(0, 80);
  return "Report";
}

function codeTitle(code: string, language: string, filename?: string): string {
  if (filename) return filename;
  const first = code.trim().split("\n")[0]?.trim() ?? "";
  const named = first.match(/(?:function|class|const|def|interface|type)\s+([A-Za-z0-9_]+)/);
  if (named) return named[1];
  return language ? `${language} snippet` : "Snippet";
}

function isReport(text: string, segments: Segment[]): boolean {
  if (text.length < REPORT_MIN_CHARS) return false;
  if (countSectionHeadings(text) < REPORT_MIN_HEADINGS) return false;
  // Not a report if a single code block dominates the answer.
  const codeChars = segments
    .filter((s) => s.kind === "code")
    .reduce((n, s) => n + s.text.length, 0);
  return codeChars < text.length * 0.55;
}

/** Split a Markdown table out of a prose block, keeping the surrounding text. */
function extractTables(
  text: string,
  makeArtifact: (markdown: string) => CanvasArtifact,
): DisplayPart[] {
  const lines = text.split("\n");
  const out: DisplayPart[] = [];
  let buffer: string[] = [];
  let i = 0;

  const flushProse = () => {
    const t = buffer.join("\n").trim();
    if (t) out.push({ type: "text", text: t });
    buffer = [];
  };

  while (i < lines.length) {
    const line = lines[i];
    const next = lines[i + 1] ?? "";
    const looksLikeTable =
      line.includes("|") && /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(next) && next.includes("-");
    if (looksLikeTable) {
      let j = i + 2;
      while (j < lines.length && lines[j].includes("|") && lines[j].trim()) j += 1;
      const markdown = lines.slice(i, j).join("\n");
      if (tableBodyRows(markdown) >= TABLE_MIN_BODY_ROWS) {
        flushProse();
        const artifact = makeArtifact(markdown);
        out.push({
          type: "canvas_ref",
          artifact: { id: artifact.id, type: "table", title: artifact.title },
        });
        i = j;
        continue;
      }
    }
    buffer.push(line);
    i += 1;
  }
  flushProse();
  return out;
}

function mergeAdjacentText(parts: DisplayPart[]): DisplayPart[] {
  const out: DisplayPart[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    if (part.type === "text" && prev && prev.type === "text") {
      prev.text = `${prev.text}\n\n${part.text}`.trim();
    } else {
      out.push(part.type === "text" ? { ...part } : part);
    }
  }
  return out.filter((p) => p.type !== "text" || p.text.trim().length > 0);
}

/**
 * Derives the Canvas artifacts in a completed assistant message and the parts
 * the chat thread should render (large artifacts collapsed to `canvas_ref`
 * cards). While a message is still streaming this is a no-op so the answer
 * appears normally as it arrives.
 */
export function planMessageDisplay(
  message: Message,
  context?: PlanContext,
): MessageDisplayPlan {
  if (message.role !== "assistant" || message.status === "streaming") {
    return { displayParts: message.parts, artifacts: [] };
  }

  if (context?.humanizerOriginal != null && context.humanizerOriginal.trim()) {
    return planHumanizerDisplay(message, context.humanizerOriginal.trim());
  }

  const artifacts: CanvasArtifact[] = [];
  const displayParts: DisplayPart[] = [];
  const baseArtifact = (partIndex: number, type: CanvasArtifactType) => ({
    id: `${message.id}:${partIndex}`,
    type,
    conversationId: "",
    messageId: message.id,
    createdAt: message.createdAt,
  });

  message.parts.forEach((part, index) => {
    if (part.type === "code") {
      const type: CanvasArtifactType = HTML_LANGS.has(part.language.toLowerCase())
        ? "html"
        : "code";
      const title = codeTitle(part.code, part.language, part.filename);
      const lang = part.language || "text";
      const lines = part.code.split("\n").length;
      const artifact: CanvasArtifact = {
        ...baseArtifact(index, type),
        title,
        language: part.language,
        code: part.code,
        ...(type === "html" ? { html: part.code } : {}),
        meta: { language: lang, lines },
      };
      artifacts.push(artifact);
      displayParts.push({
        type: "canvas_ref",
        artifact: { id: artifact.id, type, title, subtitle: `${lang} · ${lines} lines` },
      });
      return;
    }

    if (part.type === "table") {
      if (tableBodyRows(part.markdown) < TABLE_MIN_BODY_ROWS) {
        displayParts.push(part);
        return;
      }
      const artifact: CanvasArtifact = {
        ...baseArtifact(index, "table"),
        title: "Data table",
        markdown: part.markdown,
        meta: { rows: tableBodyRows(part.markdown) },
      };
      artifacts.push(artifact);
      displayParts.push({
        type: "canvas_ref",
        artifact: { id: artifact.id, type: "table", title: artifact.title },
      });
      return;
    }

    if (part.type === "image") {
      const artifact: CanvasArtifact = {
        ...baseArtifact(index, "image"),
        title: "Generated image",
        imageUrl: part.url || undefined,
        imagePrompt: part.prompt,
        meta: part.prompt ? { prompt: part.prompt } : undefined,
      };
      artifacts.push(artifact);
      displayParts.push({
        type: "canvas_ref",
        artifact: { id: artifact.id, type: "image", title: artifact.title },
      });
      return;
    }

    if (part.type !== "text") {
      displayParts.push(part);
      return;
    }

    // ---- text part: report? big code blocks? standalone tables? -------------
    const segments = splitFences(part.text);

    if (isReport(part.text, segments)) {
      const title = reportTitle(part.text);
      const artifact: CanvasArtifact = {
        ...baseArtifact(index, "report"),
        title,
        markdown: part.text,
        meta: {
          headings: countHeadings(part.text),
          words: part.text.split(/\s+/).filter(Boolean).length,
        },
      };
      artifacts.push(artifact);
      displayParts.push({
        type: "canvas_ref",
        artifact: {
          id: artifact.id,
          type: "report",
          title,
          teaser: reportTeaser(part.text, title),
        },
      });
      return;
    }

    let extractedSomething = false;
    const localParts: DisplayPart[] = [];
    segments.forEach((seg, si) => {
      if (seg.kind === "code" && isSubstantialCode(seg.text)) {
        const type: CanvasArtifactType = HTML_LANGS.has(seg.lang.toLowerCase())
          ? "html"
          : "code";
        const title = codeTitle(seg.text, seg.lang);
        const lang = seg.lang || "text";
        const lines = seg.text.split("\n").length;
        const artifact: CanvasArtifact = {
          ...baseArtifact(index, type),
          id: `${message.id}:${index}:${si}`,
          title,
          language: lang,
          code: seg.text,
          ...(type === "html" ? { html: seg.text } : {}),
          meta: { language: lang, lines },
        };
        artifacts.push(artifact);
        localParts.push({
          type: "canvas_ref",
          artifact: { id: artifact.id, type, title, subtitle: `${lang} · ${lines} lines` },
        });
        extractedSomething = true;
      } else if (seg.kind === "code") {
        localParts.push({
          type: "text",
          text: `\`\`\`${seg.lang}\n${seg.text}\n\`\`\``,
        });
      } else {
        const withTables = extractTables(seg.text, (markdown) => {
          const artifact: CanvasArtifact = {
            ...baseArtifact(index, "table"),
            id: `${message.id}:${index}:t${si}`,
            title: "Data table",
            markdown,
            meta: { rows: tableBodyRows(markdown) },
          };
          artifacts.push(artifact);
          return artifact;
        });
        if (withTables.some((p) => p.type === "canvas_ref")) extractedSomething = true;
        localParts.push(...withTables);
      }
    });

    if (extractedSomething) {
      displayParts.push(...localParts);
    } else {
      displayParts.push(part);
    }
  });

  // `conversationId` on each artifact is filled in by the caller (the hook has it).
  return { displayParts: mergeAdjacentText(displayParts), artifacts };
}
