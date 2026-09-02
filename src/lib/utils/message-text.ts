import type { Message } from "@/types/chat";

/** Flattens a message's parts to plain text for copy-to-clipboard. */
export function messageToPlainText(message: Message): string {
  return message.parts
    .map((part) => {
      switch (part.type) {
        case "text":
          return part.text;
        case "code":
          return `\n${part.code}\n`;
        case "table":
          return part.markdown;
        case "tool_call":
          return `[${part.label}]`;
        case "citation_group":
          return part.citations.map((c) => `[${c.id}] ${c.label}`).join("\n");
        case "image":
          return part.prompt ? `[image: ${part.prompt}]` : "[image]";
        default:
          return "";
      }
    })
    .filter(Boolean)
    .join("\n\n")
    .trim();
}
