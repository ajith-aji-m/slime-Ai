import type { HumanizerVoiceCheck } from "@/types/humanizer";

/**
 * First-person-plural pronouns ("we", "our", "us", …) are one of the more
 * recognizable corporate/AI-marketing tells — the Humanizer's job is to
 * rewrite *away* from that voice, not just tidy the phrasing. This checks
 * whatever the rewrite came back with (mock or a real routed model — the
 * system prompt asks for this, but a model can still ignore it) so the
 * report can flag it either way, the same way `droppedKeywords` flags a
 * fact that got lost.
 */
const FIRST_PERSON_PLURAL = /\b(we|we're|we've|we'll|we'd|our|ours|us|ourselves)\b/gi;

/** Strip fenced code blocks before scanning — pronouns inside code aren't prose. */
function proseOnly(text: string): string {
  return text.replace(/```[\s\S]*?```/g, "");
}

export function checkFirstPersonPlural(text: string): HumanizerVoiceCheck {
  const matches = proseOnly(text).match(FIRST_PERSON_PLURAL) ?? [];
  const found = Array.from(new Set(matches.map((m) => m.toLowerCase())));
  return { found, count: matches.length };
}
