import type { Message } from "@/types/chat";
import { createId, nowIso } from "@/lib/utils/id";

/**
 * Instruction the Humanizer prepends as a system message. It rides the normal
 * provider/router path — no new provider, no hard-coded model — so whichever
 * model the internal router picks does the rewrite, with the app's existing
 * fallback + error handling behind it.
 */
export const HUMANIZER_SYSTEM_PROMPT = [
  "You are Slime AI's Humanizer. The user's message is AI-generated text (often",
  "from ChatGPT or a similar system). Rewrite it so it reads as natural,",
  "confident human writing.",
  "",
  "Fix, specifically:",
  "- unnatural AI phrasing and robotic transitions (\"Moreover,\", \"In conclusion,\",",
  "  \"It is important to note that\")",
  "- repetitive sentence structure and vocabulary; vary rhythm and length",
  "- overly formal or hedged wording; prefer plain, direct language",
  "- excessive verbosity and filler; tighten without losing substance",
  "- corporate/AI \"we\" voice — do not use \"we\", \"our\", \"us\", \"ours\" or",
  "  \"ourselves\" anywhere in the rewrite; rewrite those sentences in a direct,",
  "  neutral, or second-person voice instead (e.g. \"We recommend running the",
  "  tests first\" -> \"Run the tests first\")",
  "",
  "Preserve, exactly:",
  "- the original meaning, intent, facts, figures and logical structure",
  "- technical terms, product/brand/person names, numbers, dates, citations,",
  "  quotes, code and URLs — do not paraphrase or drop these",
  "- important SEO / domain keywords",
  "- formatting (headings, lists, paragraph breaks) where it already exists",
  "",
  "Do not add new claims, opinions, headings or a preamble. Do not explain what",
  "you changed. Return only the rewritten text.",
].join("\n");

/**
 * Returns a copy of the outgoing messages with the Humanizer instruction
 * prepended as a system message. Nothing here is persisted — the stored user
 * message keeps the original pasted content, which is what the diff compares
 * against.
 */
export function buildHumanizerMessages(messages: Message[]): Message[] {
  const system: Message = {
    id: createId("msg"),
    role: "system",
    parts: [{ type: "text", text: HUMANIZER_SYSTEM_PROMPT }],
    createdAt: nowIso(),
  };
  return [system, ...messages];
}
