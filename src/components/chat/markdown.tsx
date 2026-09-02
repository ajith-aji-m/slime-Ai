import { Fragment } from "react";

/**
 * Compact Markdown renderer for assistant prose. Deliberately small — the mock
 * engine produces controlled content and GFM tables arrive as their own message
 * part. Swap in `react-markdown` + `remark-gfm` here if free-form MD is needed.
 */

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern =
    /(\*\*([^*]+)\*\*)|(`([^`]+)`)|(\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    if (match[2] !== undefined) {
      nodes.push(<strong key={`${keyBase}-b${i}`}>{match[2]}</strong>);
    } else if (match[4] !== undefined) {
      nodes.push(
        <code
          key={`${keyBase}-c${i}`}
          className="rounded bg-surface-container-high px-1.5 py-0.5 font-mono text-[0.85em]"
        >
          {match[4]}
        </code>,
      );
    } else if (match[6] !== undefined) {
      nodes.push(
        <a
          key={`${keyBase}-l${i}`}
          href={match[7]}
          className="font-medium text-primary hover:underline"
          target="_blank"
          rel="noreferrer"
        >
          {match[6]}
        </a>,
      );
    }
    last = pattern.lastIndex;
    i += 1;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <>
      {blocks.map((block, bi) => {
        const key = `blk-${bi}`;
        const lines = block.split("\n");

        if (/^#{1,3}\s/.test(block)) {
          const level = block.match(/^#+/)?.[0].length ?? 3;
          const content = block.replace(/^#+\s/, "");
          const Tag = (["h3", "h3", "h4"][level - 1] ?? "h4") as "h3" | "h4";
          return (
            <Tag
              key={key}
              className="mt-4 mb-2 text-base font-semibold text-on-surface first:mt-0"
            >
              {renderInline(content, key)}
            </Tag>
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

        if (lines.every((l) => /^\s*\d+\.\s/.test(l))) {
          return (
            <ol key={key} className="my-2 list-decimal space-y-1 pl-5">
              {lines.map((l, li) => (
                <li key={`${key}-${li}`}>
                  {renderInline(l.replace(/^\s*\d+\.\s/, ""), `${key}-${li}`)}
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
