import { Icon } from "@/components/ui";
import type { MessagePart } from "@/types/chat";
import { Markdown } from "./markdown";
import { CodeBlock } from "./code-block";
import { MarkdownTable } from "./markdown-table";
import { CitationList } from "./citation-list";
import { ToolCallChip } from "./tool-call-chip";

export function MessageParts({ parts }: { parts: MessagePart[] }) {
  return (
    <div className="text-[15px] leading-relaxed text-on-surface">
      {parts.map((part, i) => {
        switch (part.type) {
          case "text":
            return part.text ? <Markdown key={i} text={part.text} /> : null;
          case "code":
            return (
              <CodeBlock
                key={i}
                code={part.code}
                language={part.language}
                filename={part.filename}
              />
            );
          case "table":
            return <MarkdownTable key={i} markdown={part.markdown} />;
          case "tool_call":
            return (
              <ToolCallChip
                key={i}
                tool={part.tool}
                label={part.label}
                status={part.status}
                detail={part.detail}
              />
            );
          case "citation_group":
            return <CitationList key={i} citations={part.citations} />;
          case "image":
            return (
              <div
                key={i}
                className="my-3 flex aspect-video items-center justify-center rounded-lg border border-outline-variant bg-surface-container-low text-on-surface-variant"
              >
                <span className="flex items-center gap-2 text-sm">
                  <Icon name="image" size={18} />
                  Image generation is mocked in this build
                </span>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
