/**
 * Offline heuristic rewrite used only by the built-in mock provider (no
 * `NVIDIA_API_KEY`). It is deliberately conservative — a handful of well-known
 * "AI tell" substitutions plus light contraction — so the Humanizer preview and
 * diff have real, meaning-preserving changes to show without a network call.
 * When a real model is configured, `routeChat` handles the rewrite instead.
 */

// Corporate/AI "we" voice — the Humanizer avoids this everywhere (see
// HUMANIZER_SYSTEM_PROMPT for the same rule aimed at a real routed model).
// Kept to the common lead-in constructs, same conservative spirit as
// PHRASES below — a general pronoun rewriter risks mangling grammar, so
// mid-sentence "we"/"our"/"us" left over is surfaced by the report's voice
// check instead of guessed at here.
const PRONOUN_LEADINS: [RegExp, string][] = [
  [/\bwe(?:'re| are)\s+excited to\b/gi, "excited to"],
  [/\bwe(?:'re| are)\s+thrilled to\b/gi, "thrilled to"],
  [/\bwe(?:'re| are)\s+pleased to\b/gi, "pleased to"],
  [/\bwe(?:'re| are)\s+committed to\b/gi, "committed to"],
  [/\bwe believe(?:\s+that)?\s+/gi, ""],
  [/\bwe think(?:\s+that)?\s+/gi, ""],
  [/\bwe found that\s+/gi, ""],
  [/\bin our (?:opinion|experience|view),?\s*/gi, ""],
  [/\bour\s+team\b/gi, "the team"],
  [/\bour\s+company\b/gi, "the company"],
  [/\bour\s+goal\b/gi, "the goal"],
  [/\bour\s+mission\b/gi, "the mission"],
  [/\ball of us\b/gi, "everyone"],
  [/\blet us\b/gi, "let's"],
];

const PHRASES: [RegExp, string][] = [
  [/\bit is important to note that\s+/gi, ""],
  [/\bit is worth noting that\s+/gi, ""],
  [/\bit should be noted that\s+/gi, ""],
  [/\bneedless to say,?\s+/gi, ""],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bin the event that\b/gi, "if"],
  [/\bat this point in time\b/gi, "now"],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bwith regard to\b/gi, "about"],
  [/\ba large number of\b/gi, "many"],
  [/\bthe vast majority of\b/gi, "most"],
  [/\ba number of\b/gi, "several"],
  [/\butili[sz]e\b/gi, "use"],
  [/\bleverage\b/gi, "use"],
  [/\bfacilitate\b/gi, "help"],
  [/\bdemonstrate\b/gi, "show"],
  [/\bnumerous\b/gi, "many"],
  [/\bmoreover,?\s+/gi, "Also, "],
  [/\bfurthermore,?\s+/gi, "On top of that, "],
  [/\badditionally,?\s+/gi, "Plus, "],
  [/\bin conclusion,?\s+/gi, "So, "],
  [/\boverall,?\s+/gi, "In short, "],
  [/\bvery\s+/gi, ""],
  [/\bin today's world,?\s+/gi, ""],
  [/\bin the modern era,?\s+/gi, ""],
];

const CONTRACTIONS: [RegExp, string][] = [
  [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bdid not\b/gi, "didn't"],
  [/\bis not\b/gi, "isn't"],
  [/\bare not\b/gi, "aren't"],
  [/\bwas not\b/gi, "wasn't"],
  [/\bwere not\b/gi, "weren't"],
  [/\bcannot\b/gi, "can't"],
  [/\bcan not\b/gi, "can't"],
  [/\bwill not\b/gi, "won't"],
  [/\bwould not\b/gi, "wouldn't"],
  [/\bhas not\b/gi, "hasn't"],
  [/\bhave not\b/gi, "haven't"],
  [/\bit is\b/gi, "it's"],
  [/\bthat is\b/gi, "that's"],
  [/\bthere is\b/gi, "there's"],
  [/\bwe are\b/gi, "we're"],
  [/\bthey are\b/gi, "they're"],
  [/\byou are\b/gi, "you're"],
];

function preserveCase(replacement: string, original: string): string {
  if (/^[A-Z]/.test(original) && replacement.length > 0) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

function applyRules(text: string, rules: [RegExp, string][]): string {
  let out = text;
  for (const [re, replacement] of rules) {
    out = out.replace(re, (match) => preserveCase(replacement, match));
  }
  return out;
}

function rewriteProse(prose: string): string {
  let out = applyRules(prose, PRONOUN_LEADINS);
  out = applyRules(out, PHRASES);
  out = applyRules(out, CONTRACTIONS);
  // Tidy up artefacts from removed lead-ins: stray leading spaces, lowercase
  // sentence starts, doubled spaces.
  out = out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/(^|[.!?]\s+|\n)([a-z])/g, (_m, lead: string, ch: string) => lead + ch.toUpperCase())
    .replace(/ +([.,;:!?])/g, "$1");
  return out;
}

/** Rewrite `text`, leaving fenced code blocks untouched. */
export function mockHumanize(text: string): string {
  const input = text.trim();
  if (!input) return input;
  return input
    .split(/(```[\s\S]*?```)/g)
    .map((chunk) => (chunk.startsWith("```") ? chunk : rewriteProse(chunk)))
    .join("");
}
