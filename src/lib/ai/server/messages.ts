import "server-only";
import type { Attachment, Message } from "@/types/chat";
import { isImageAttachment, isTextAttachment } from "@/lib/utils/file";

export type OpenAIContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string | OpenAIContentPart[];
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
    const content = [
      partsToText(message),
      attachmentsContent(message),
      attachmentsNote(message),
    ]
      .filter(Boolean)
      .join("\n\n");
    if (!content) continue;
    out.push({
      role: message.role === "assistant" ? "assistant" : "user",
      content,
    });
  }
  return out;
}

/**
 * Same flattening as `toOpenAIMessages`, but the newest user message's image
 * attachments (if any survived the client's size-gated strip — see
 * `stripAttachmentData` in the conversation store) are embedded as
 * `image_url` content parts alongside its text, in the OpenAI vision dialect
 * NVIDIA's vision NIMs speak. Only for the vision fork in `router.ts` — never
 * used for ordinary text routing.
 */
export function toOpenAIVisionMessages(
  messages: Message[],
  system?: string,
): OpenAIMessage[] {
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const images = (lastUser?.attachments ?? []).filter(
    (a): a is Attachment & { url: string } =>
      !!a.url && a.mimeType.startsWith("image/"),
  );
  if (images.length === 0) return toOpenAIMessages(messages, system);

  // An attachment-only message (no text) would otherwise be dropped by
  // `toOpenAIMessages`'s empty-content filter — give it a placeholder so it
  // survives and gets the image_url content attached below.
  const withPlaceholder = messages.map((m) =>
    m === lastUser && !partsToText(m)
      ? { ...m, parts: [...m.parts, { type: "text" as const, text: " " }] }
      : m,
  );
  const out = toOpenAIMessages(withPlaceholder, system);
  if (out.length === 0) return out;

  const target = out[out.length - 1];
  const text = typeof target.content === "string" ? target.content : "";
  target.content = [
    { type: "text", text: text || "What's in this image?" },
    ...images.map((img) => ({
      type: "image_url" as const,
      image_url: { url: img.url },
    })),
  ];
  return out;
}

/**
 * A note for attachments whose data never made it to this request (every
 * non-image, non-text file, and anything oversized — see
 * `stripAttachmentData` in the conversation store) — so the model states
 * plainly that it can't view them, instead of denying anything was attached
 * at all.
 */
function attachmentsNote(message: Message): string {
  const unseen = (message.attachments ?? []).filter((a) => !a.url);
  if (unseen.length === 0) return "";
  const names = unseen.map((a) => a.name).join(", ");
  return `[The user attached ${unseen.length === 1 ? "a file" : "files"} you cannot view the contents of: ${names}. Say so plainly if asked about it — never claim nothing was attached.]`;
}

const MAX_INLINED_CHARS = 8_000;

/**
 * Inlines the raw content of text-like attachments (CSV, JSON, plain text,
 * Markdown, etc. — see `isTextAttachment`) that survived the client's
 * size-gated strip, as a fenced block per file. Images are handled
 * separately by `toOpenAIVisionMessages`, never here.
 */
function attachmentsContent(message: Message): string {
  const files = (message.attachments ?? []).filter(
    (a): a is Attachment & { url: string } =>
      !!a.url && isTextAttachment(a) && !isImageAttachment(a),
  );
  if (files.length === 0) return "";

  return files
    .map((a) => {
      const text = decodeDataUrlText(a.url);
      if (!text) return "";
      const truncated =
        text.length > MAX_INLINED_CHARS
          ? `${text.slice(0, MAX_INLINED_CHARS)}\n… (truncated)`
          : text;
      return `Attached file "${a.name}":\n\`\`\`\n${truncated}\n\`\`\``;
    })
    .filter(Boolean)
    .join("\n\n");
}

function decodeDataUrlText(dataUrl: string): string {
  try {
    const comma = dataUrl.indexOf(",");
    if (comma === -1) return "";
    const meta = dataUrl.slice(0, comma);
    const data = dataUrl.slice(comma + 1);
    if (meta.includes(";base64")) {
      return Buffer.from(data, "base64").toString("utf-8");
    }
    return decodeURIComponent(data);
  } catch {
    return "";
  }
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
