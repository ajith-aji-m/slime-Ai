import type { Message } from "@/types/chat";
import { createId, nowIso } from "@/lib/utils/id";

/**
 * Instruction the Prompt Generator prepends as a system message. It rides
 * the normal provider/router path — no new provider, no hard-coded model —
 * so whichever model the internal router picks does the write-up, with the
 * app's existing fallback + error handling behind it.
 */
export const PROMPT_GENERATOR_SYSTEM_PROMPT = [
  "You are Slime AI's Prompt Generator. The user describes, in their own rough",
  "words, what they want an AI system to do. Turn that into a single, clear,",
  "ready-to-use prompt they can paste straight into any AI chat or API.",
  "",
  "Do not answer the user's underlying request yourself — write the prompt",
  "for it, don't fulfill it.",
  "",
  "Structure the generated prompt in Markdown with these sections, only",
  "including ones that add real value for this request:",
  "- **Role** — a persona/expertise framing, when it sharpens the answer",
  "- **Context** — the background the AI needs, pulled from what the user gave",
  "- **Task** — the specific, actionable instruction",
  "- **Constraints** — length, tone, things to avoid, things to always include",
  "- **Output format** — structure, format, or length of the expected answer",
  "",
  "Ask no clarifying questions — if a detail is missing, write the prompt to",
  "instruct the AI to ask for it or make a sensible, stated assumption. Keep",
  "the generated prompt tight: no meta-commentary, no \"Here's your prompt:\"",
  "preamble, no explanation of what you did. Return only the generated",
  "prompt itself.",
].join("\n");

/**
 * Returns a copy of the outgoing messages with the Prompt Generator
 * instruction prepended as a system message. Nothing here is persisted —
 * the stored user message keeps the original rough idea as typed.
 */
export function buildPromptGeneratorMessages(messages: Message[]): Message[] {
  const system: Message = {
    id: createId("msg"),
    role: "system",
    parts: [{ type: "text", text: PROMPT_GENERATOR_SYSTEM_PROMPT }],
    createdAt: nowIso(),
  };
  return [system, ...messages];
}
