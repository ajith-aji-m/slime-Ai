import "server-only";
import type { Message } from "@/types/chat";

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Flattens Slime's part-based messages into the plain OpenAI-compatible
 * `{ role, content }` shape. Non-text parts are rendered as a short text
 * placeholder so context is preserved without leaking internal structure.
 */
export function toOpenAIMessages(
  messages: Message[],
  system?: string,
): OpenAIMessage[] {
  const out: OpenAIMessage[] = [];
  if (system) out.push({ role: "system", content: system });

  for (const message of messages) {
    if (message.role === "system") {
      out.push({ role: "system", content: partsToText(message) });
      continue;
    }
    const content = partsToText(message);
    if (!content) continue;
    out.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content,
    });
  }
  return out;
}

function partsToText(message: Message): string {
  return message.parts
    .map((part) => {
      switch (part.type) {
        case "text":
          return part.text;
        case "code":
          return `\n\`\`\`${part.language}\n${part.code}\n\`\`\`\n`;
        case "table":
          return part.markdown;
        case "citation_group":
          return part.citations.map((c) => `[${c.id}] ${c.label}`).join("\n");
        case "tool_call":
          return `(${part.label})`;
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
