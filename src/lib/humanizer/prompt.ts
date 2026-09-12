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
 *
 * Formality alone does not defeat AI-detection — a uniformly formal,
 * evenly-paced rewrite is itself a classic AI tell. The instructions below
 * spend most of their weight on the structural signals that actually read as
 * machine-written (uniform sentence length, template paragraph scaffolding,
 * a small rotating set of stock connectors) rather than on vocabulary
 * formality alone. This app does not claim or estimate a detector score (see
 * git history: a local detector-pass heuristic was tried and reverted for
 * not paying for its complexity) — the fix lives entirely in how the
 * rewrite itself is written.
 *
 * Reliably satisfying this many precise structural constraints (an exact
 * sentence-length-variance ratio, never repeating a connector, no matched
 * three-part lists) is an instruction-following problem more than a
 * "sounds natural" style problem — see ai-router.ts's `humanize` routing
 * comment for why the flagship generalist is tried before the model
 * originally picked for this category.
 */
export const HUMANIZER_SYSTEM_PROMPT = [
  "You are Slime AI's Humanizer. The user's message is AI-generated text (often",
  "from ChatGPT or a similar system). Rewrite it so it reads as natural,",
  "human-written academic prose — the register expected in an essay, research",
  "paper or professional report — eliminating the patterns that make text",
  "recognizable as AI-generated, not just softening its formality.",
  "",
  "The single strongest AI tell is uniformity, not formality. Fix, specifically:",
  "- uniform sentence length and rhythm — deliberately vary it: mix short,",
  "  direct sentences with longer, more complex ones; never let three",
  "  sentences in a row share the same length or structure; within any",
  "  paragraph of 4+ sentences, the shortest and longest should differ by at",
  "  least 3x in word count",
  "- rigid, formulaic paragraph scaffolding (a topic sentence, three evenly",
  "  sized supporting points, a \"in conclusion\" wrap-up) — restructure so",
  "  paragraph length varies and the argument builds, rather than following a",
  "  template",
  "- parallel \"listy\" triads (\"X improves A, enhances B, and streamlines C\") —",
  "  a model writing in perfectly matched three-part structures is one of the",
  "  most recognizable AI patterns; break the symmetry, merge items, or state",
  "  one point as its own sentence instead",
  "- every sentence starting the same way (subject + verb, or the same",
  "  opening word); vary sentence openers within a paragraph",
  "- robotic stock transitions and connectors (\"Moreover,\", \"Furthermore,\",",
  "  \"In conclusion,\", \"It is important to note that\") — never lean on the",
  "  same connector twice in one piece; vary the wording, or cut the connector",
  "  and let the logic carry itself",
  "- AI-favorite \"impressive\" vocabulary (utilize, leverage, delve, robust,",
  "  seamless, testament to, cannot be overstated, boasts) — prefer the",
  "  specific, precise word a subject-matter expert would actually reach for",
  "- padding, throat-clearing and empty filler (\"it is worth noting\",",
  "  \"needless to say\"); tighten without losing substance or precision",
  "- corporate/AI \"we\" voice — do not use \"we\", \"our\", \"us\", \"ours\" or",
  "  \"ourselves\" anywhere in the rewrite; use a third-person, objective",
  "  academic voice instead (e.g. \"We recommend running the tests first\" ->",
  "  \"Running the tests first is recommended\")",
  "",
  "Maintain a formal academic tone throughout — this is about register, not",
  "about sounding like a template:",
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
  "",
  "Before returning your answer, check the draft against every rule above —",
  "count the words in the shortest and longest sentence of each paragraph,",
  "look for any connector or opening word used twice, look for a matched",
  "three-part list. Silently revise anything that still fails, then return",
  "only the corrected final text.",
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
