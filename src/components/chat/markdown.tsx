import { Fragment } from "react";
import { CodeBlock } from "./code-block";
import { MarkdownTable } from "./markdown-table";

/**
 * Compact Markdown renderer for assistant prose. Dependency-free — handles the
 * subset real model output uses: headings, lists, tables, fenced code, block
 * quotes, rules and inline emphasis. Tables and code delegate to the same
 * `MarkdownTable` / `CodeBlock` components structured message parts use, so
 * mock output and streamed NVIDIA output look identical.
 */

type Segment =
  | { kind: "code"; lang: string; code: string }
  | { kind: "prose"; text: string };

/** Split a string on ``` fences, tolerating an unclosed fence mid-stream. */
function splitCodeFences(input: string): Segment[] {
  const segments: Segment[] = [];
  const fence = /(^|\n)```([^\n`]*)\n([\s\S]*?)(?:\n```(?=\n|$)|$)/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(input)) !== null) {
    const start = match.index + match[1].length;
    if (start > last) {
      segments.push({ kind: "prose", text: input.slice(last, start) });
    }
    segments.push({
      kind: "code",
      lang: match[2].trim(),
      code: match[3].replace(/\n$/, ""),
    });
    last = fence.lastIndex;
  }
  if (last < input.length) {
    segments.push({ kind: "prose", text: input.slice(last) });
  }

  return segments.filter(
    (s) => s.kind === "code" || s.text.trim().length > 0,
  );
}

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /\*\*([^*]+)\*\*|(?<!\*)\*([^*\n]+)\*(?!\*)|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={`${keyBase}-b${i}`} className="font-semibold text-on-surface">
          {match[1]}
        </strong>,
      );
    } else if (match[2] !== undefined) {
      nodes.push(<em key={`${keyBase}-i${i}`}>{match[2]}</em>);
    } else if (match[3] !== undefined) {
      nodes.push(
        <code
          key={`${keyBase}-c${i}`}
          className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {match[3]}
        </code>,
      );
    } else if (match[4] !== undefined) {
      nodes.push(
        <a
          key={`${keyBase}-l${i}`}
          href={match[5]}
          className="font-medium text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {match[4]}
        </a>,
      );
    }
    last = pattern.lastIndex;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function isTableBlock(lines: string[]): boolean {
  if (lines.length < 2) return false;
  if (!lines[0].includes("|")) return false;
  const sep = lines[1].trim();
  return /^\|?[\s:|-]+\|[\s:|-]+$/.test(sep) && sep.includes("-");
}

function Prose({ text }: { text: string }) {
  const blocks = text.replace(/\n{3,}/g, "\n\n").split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, bi) => {
        const key = `blk-${bi}`;
        const trimmed = block.trim();
        if (!trimmed) return null;
        const lines = block.split("\n");

        if (/^(---+|\*\*\*+|___+)$/.test(trimmed)) {
          return <hr key={key} className="my-4 border-t border-outline-variant" />;
        }

        if (isTableBlock(lines)) {
          return <MarkdownTable key={key} markdown={block} />;
        }

        if (/^#{1,6}\s/.test(trimmed)) {
          const level = trimmed.match(/^#+/)?.[0].length ?? 3;
          const Tag = (level <= 1 ? "h3" : "h4") as "h3" | "h4";
          return (
            <Tag
              key={key}
              className={
                level <= 1
                  ? "mt-5 mb-2 text-lg font-semibold text-on-surface first:mt-0"
                  : "mt-4 mb-1.5 text-base font-semibold text-on-surface first:mt-0"
              }
            >
              {renderInline(trimmed.replace(/^#+\s/, ""), key)}
            </Tag>
          );
        }

        if (lines.every((l) => /^\s*>\s?/.test(l))) {
          return (
            <blockquote
              key={key}
              className="my-3 border-l-2 border-outline-variant pl-4 text-on-surface-variant"
            >
              {lines.map((l, li) => (
                <Fragment key={`${key}-${li}`}>
                  {li > 0 ? <br /> : null}
                  {renderInline(l.replace(/^\s*>\s?/, ""), `${key}-${li}`)}
                </Fragment>
              ))}
            </blockquote>
          );
        }

        if (lines.every((l) => /^\s*[-*]\s/.test(l))) {
          return (
            <ul key={key} className="my-2 list-disc space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={`${key}-${li}`}>
                  {renderInline(l.replace(/^\s*[-*]\s/, ""), `${key}-${li}`)}
                </li>
              ))}
            </ul>
          );
        }

        if (lines.every((l) => /^\s*\d+[.)]\s/.test(l))) {
          return (
            <ol key={key} className="my-2 list-decimal space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={`${key}-${li}`}>
                  {renderInline(l.replace(/^\s*\d+[.)]\s/, ""), `${key}-${li}`)}
                </li>
              ))}
            </ol>
          );
        }

        return (
          <p key={key} className="my-2 first:mt-0 last:mb-0">
            {lines.map((l, li) => (
              <Fragment key={`${key}-${li}`}>
                {li > 0 ? <br /> : null}
                {renderInline(l, `${key}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

export function Markdown({ text }: { text: string }) {
  return (
    <>
      {splitCodeFences(text).map((seg, i) =>
        seg.kind === "code" ? (
          <CodeBlock key={i} code={seg.code} language={seg.lang || "text"} />
        ) : (
          <Prose key={i} text={seg.text} />
        ),
      )}
    </>
  );
}
