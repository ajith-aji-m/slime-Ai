import type { Message } from "@/types/chat";
import { createId, nowIso } from "@/lib/utils/id";

/**
 * Instruction for the one-shot title-generation request. Unlike Humanizer /
 * Prompt Generator this never rides inside the real conversation — it's a
 * throwaway synthetic request (see `buildTitleRequestMessages`) built only to
 * ask "what is this conversation about", so the system prompt can be blunt
 * about the exact output contract instead of sharing space with
 * general-purpose chat instructions.
 */
export const TITLE_SYSTEM_PROMPT = [
  "Generate a short title for the conversation transcript below — the kind",
  "shown in a chat app's history list.",
  "",
  "Rules:",
  "- 3 to 6 words.",
  "- Plain text only: no quotes, no Markdown, no trailing punctuation.",
  "- Sentence case — capitalize only the first word and proper nouns.",
  '- Name the topic, not the act of discussing it ("Banana bread recipe", not',
  '  "Discussion about baking").',
  "- Reply with the title only. Nothing else — no preamble, no explanation.",
].join("\n");

const MAX_TRANSCRIPT_CHARS = 4000;

function messageText(m: Message): string {
  return m.parts
    .map((p) => {
      if (p.type === "text") return p.text;
      if (p.type === "code") return p.code;
      if (p.type === "table") return p.markdown;
      return "";
    })
    .join(" ")
    .trim();
}

/**
 * Builds the synthetic request sent to the `title` category: a system
 * instruction plus a compact transcript of the real conversation. Capped —
 * a title needs the gist, not the full history, and this rides on every
 * (re)title call rather than once per conversation like an ordinary turn.
 */
export function buildTitleRequestMessages(messages: Message[]): Message[] {
  const transcript = messages
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${messageText(m)}`)
    .filter((line) => !/^(User|Assistant):\s*$/.test(line))
    .join("\n")
    .slice(0, MAX_TRANSCRIPT_CHARS);

  return [
    {
      id: createId("msg"),
      role: "system",
      createdAt: nowIso(),
      parts: [{ type: "text", text: TITLE_SYSTEM_PROMPT }],
    },
    {
      id: createId("msg"),
      role: "user",
      createdAt: nowIso(),
      parts: [{ type: "text", text: transcript || "(empty conversation)" }],
    },
  ];
}
