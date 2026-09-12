import type { Message } from "@/types/chat";
import { createId, nowIso } from "@/lib/utils/id";

/**
 * Instruction the Humanizer prepends as a system message. It rides the normal
 * provider/router path — no new provider, no hard-coded model — so whichever
 * model the internal router picks does the rewrite, with the app's existing
 * fallback + error handling behind it.
 *
 * Target register is academic/formal — an essay, research paper or
 * professional report — not casual conversation. The rewrite still has to
 * read as something a person wrote (not a machine), but "human" here means
 * natural scholarly prose, never contractions, slang or a chatty voice.
 */
export const HUMANIZER_SYSTEM_PROMPT = [
  "You are Slime AI's Humanizer. The user's message is AI-generated text (often",
  "from ChatGPT or a similar system). Rewrite it so it reads as natural,",
  "human-written academic prose — the register expected in an essay, research",
  "paper or professional report — while still sounding like a person wrote it,",
  "not a machine.",
  "",
  "Fix, specifically:",
  "- unnatural AI phrasing and robotic stock transitions (\"Moreover,\" opening",
  "  every paragraph, \"In conclusion,\", \"It is important to note that\") — vary",
  "  wording and structure instead of leaning on the same cliché",
  "- repetitive sentence structure and vocabulary; vary rhythm and length the",
  "  way a human writer naturally would",
  "- padding, throat-clearing and empty filler; tighten without losing",
  "  substance or precision",
  "- corporate/AI \"we\" voice — do not use \"we\", \"our\", \"us\", \"ours\" or",
  "  \"ourselves\" anywhere in the rewrite; use a third-person, objective",
  "  academic voice instead (e.g. \"We recommend running the tests first\" ->",
  "  \"Running the tests first is recommended\")",
  "",
  "Maintain a formal academic tone throughout:",
  "- never use contractions (write \"do not\", \"it is\", \"cannot\" — never",
  "  \"don't\", \"it's\", \"can't\"); expand any that are already in the source",
  "- no slang, casual idioms or conversational asides",
  "- precise, discipline-appropriate vocabulary — do not downgrade formal or",
  "  technical terms to casual synonyms",
  "- prefer third-person or passive constructions over first- or",
  "  second-person address",
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
