/**
 * Offline heuristic rewrite used only by the built-in mock provider (no
 * `NVIDIA_API_KEY`). It is deliberately conservative — a handful of well-known
 * "AI tell" substitutions, kept within a formal academic register — so the
 * Humanizer preview and diff have real, meaning-preserving changes to show
 * without a network call. Target tone is academic/formal (an essay, research
 * paper or report), never casual — so, unlike a "make it sound chatty"
 * rewrite, this never introduces contractions or downgrades formal wording to
 * casual synonyms; it expands any contractions already present instead.
 *
 * Formality alone does not make text read as human-written — a uniformly
 * formal rewrite is itself a common AI tell. Repeated stock connectors
 * ("Moreover," "Furthermore," "In conclusion," …) are rotated through a small
 * set of equally formal alternatives (see ROTATING_TRANSITIONS) rather than
 * left as a verbatim copy of the input's own cliché, or downgraded to a
 * casual synonym. This regex-based rewrite can't restructure sentence length
 * or paragraph shape the way the real routed model's prompt asks for (see
 * `HUMANIZER_SYSTEM_PROMPT`) — that part only applies when a real model is
 * configured; `routeChat` handles the rewrite instead of this file then.
 */

// Corporate/AI "we" voice — the Humanizer avoids this everywhere (see
// HUMANIZER_SYSTEM_PROMPT for the same rule aimed at a real routed model).
// Kept to the common lead-in constructs, same conservative spirit as
// PHRASES below — a general pronoun rewriter risks mangling grammar, so
// mid-sentence "we"/"our"/"us" left over is surfaced by the report's voice
// check instead of guessed at here. Replacements stay contraction-free to
// hold the formal register.
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
  [/\blet us\b/gi, "consider the following"],
];

// Stock AI connectors — legitimate in formal writing individually, but a dead
// giveaway when the same one is reused verbatim every time it appears (the
// classic AI paragraph-scaffolding pattern). Rotated through equally formal
// alternatives per occurrence instead of left untouched or downgraded to a
// casual synonym like "Also," / "So,".
const ROTATING_TRANSITIONS: [RegExp, string[]][] = [
  [/\bmoreover,?\s+/gi, ["Moreover, ", "In addition, ", "Beyond that, "]],
  [/\bfurthermore,?\s+/gi, ["Furthermore, ", "In addition, ", "What is more, "]],
  [/\badditionally,?\s+/gi, ["Additionally, ", "In addition, ", "Also of note, "]],
  [/\bin conclusion,?\s+/gi, ["In conclusion, ", "In summary, ", "Taken together, "]],
  [/\boverall,?\s+/gi, ["Overall, ", "On the whole, ", "Taken as a whole, "]],
];

// AI-cliché phrasing and filler, rewritten toward concise, precise academic
// wording rather than casual synonyms.
const PHRASES: [RegExp, string][] = [
  [/\bit is important to note that\s+/gi, ""],
  [/\bit is worth noting that\s+/gi, ""],
  [/\bit should be noted that\s+/gi, ""],
  [/\bneedless to say,?\s+/gi, ""],
  [/\bin order to\b/gi, "to"],
  [/\bdue to the fact that\b/gi, "because"],
  [/\bin the event that\b/gi, "if"],
  [/\bat this point in time\b/gi, "at present"],
  [/\bfor the purpose of\b/gi, "for"],
  [/\bwith regard to\b/gi, "regarding"],
  [/\ba large number of\b/gi, "many"],
  [/\bthe vast majority of\b/gi, "most"],
  [/\ba number of\b/gi, "several"],
  // base forms plus common inflections — matching only the bare infinitive
  // left "utilized"/"leveraging"/etc. as an unfixed AI tell in the output;
  // the plain forms are the ones academic style guides themselves prefer
  // for concision, so this stays within a formal register.
  [/\butili[sz]ed\b/gi, "used"],
  [/\butili[sz]es\b/gi, "uses"],
  [/\butili[sz]ing\b/gi, "using"],
  [/\butili[sz]e\b/gi, "use"],
  [/\bleveraged\b/gi, "used"],
  [/\bleverages\b/gi, "uses"],
  [/\bleveraging\b/gi, "using"],
  [/\bleverage\b/gi, "use"],
  [/\bfacilitated\b/gi, "helped"],
  [/\bfacilitates\b/gi, "helps"],
  [/\bfacilitating\b/gi, "helping"],
  [/\bfacilitate\b/gi, "help"],
  [/\bdemonstrated\b/gi, "showed"],
  [/\bdemonstrates\b/gi, "shows"],
  [/\bdemonstrating\b/gi, "showing"],
  [/\bdemonstrate\b/gi, "show"],
  [/\bseamlessly\b/gi, "smoothly"],
  [/\bseamless\b/gi, "smooth"],
  [/\bboasts\b/gi, "offers"],
  [/\bunlock\b/gi, "enable"],
  [/\bunleash\b/gi, "release"],
  [/\belevate\b/gi, "enhance"],
  [/\bdelve into\b/gi, "examine"],
  [/\bdelve\b/gi, "examine"],
  [/\btestament to\b/gi, "evidence of"],
  [/\bcannot be overstated\b/gi, "is of considerable importance"],
  [/\bin the realm of\b/gi, "in"],
  [/\bgame-changer\b/gi, "significant advancement"],
  [/\btop-notch\b/gi, "excellent"],
  [/\bvery\s+/gi, ""],
  [/\bin today's world,?\s+/gi, ""],
  [/\bin the modern era,?\s+/gi, ""],
];

// Academic prose does not use contractions — expand any the source already
// has instead of introducing more of them. This is the reverse direction of
// a "make it sound casual" rewrite.
const EXPAND_CONTRACTIONS: [RegExp, string][] = [
  [/\bdon't\b/gi, "do not"],
  [/\bdoesn't\b/gi, "does not"],
  [/\bdidn't\b/gi, "did not"],
  [/\bisn't\b/gi, "is not"],
  [/\baren't\b/gi, "are not"],
  [/\bwasn't\b/gi, "was not"],
  [/\bweren't\b/gi, "were not"],
  [/\bcan't\b/gi, "cannot"],
  [/\bwon't\b/gi, "will not"],
  [/\bwouldn't\b/gi, "would not"],
  [/\bhasn't\b/gi, "has not"],
  [/\bhaven't\b/gi, "have not"],
  [/\bshouldn't\b/gi, "should not"],
  [/\bcouldn't\b/gi, "could not"],
  [/\bmustn't\b/gi, "must not"],
  [/\bit's\b/gi, "it is"],
  [/\bthat's\b/gi, "that is"],
  [/\bthere's\b/gi, "there is"],
  [/\bwho's\b/gi, "who is"],
  [/\bwhat's\b/gi, "what is"],
  [/\bhere's\b/gi, "here is"],
  [/\bwe're\b/gi, "we are"],
  [/\bthey're\b/gi, "they are"],
  [/\byou're\b/gi, "you are"],
  [/\bwe've\b/gi, "we have"],
  [/\bthey've\b/gi, "they have"],
  [/\byou've\b/gi, "you have"],
  [/\bwe'll\b/gi, "we will"],
  [/\bthey'll\b/gi, "they will"],
  [/\byou'll\b/gi, "you will"],
  [/\bi'm\b/gi, "I am"],
  [/\bi've\b/gi, "I have"],
  [/\bi'll\b/gi, "I will"],
  [/\bi'd\b/gi, "I would"],
  [/\blet's\b/gi, "let us"],
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

/** Like `applyRules`, but cycles through `alternatives` on repeat matches
 * instead of always substituting the same replacement — so three uses of
 * "moreover" in one piece don't all become the identical word. */
function applyRotatingRules(text: string, rules: [RegExp, string[]][]): string {
  let out = text;
  for (const [re, alternatives] of rules) {
    let i = 0;
    out = out.replace(re, (match) => {
      const choice = alternatives[i % alternatives.length];
      i += 1;
      return preserveCase(choice, match);
    });
  }
  return out;
}

function rewriteProse(prose: string): string {
  let out = applyRules(prose, PRONOUN_LEADINS);
  out = applyRotatingRules(out, ROTATING_TRANSITIONS);
  out = applyRules(out, PHRASES);
  out = applyRules(out, EXPAND_CONTRACTIONS);
  // Tidy up artefacts from removed lead-ins: stray leading spaces, lowercase
  // sentence starts, doubled spaces. A single `\n` is just a wrapped line
  // inside the same sentence (common in pasted text) — only a blank line
  // (a real paragraph break) counts as a boundary here, same as `.`/`!`/`?`.
  out = out
    .replace(/[ \t]{2,}/g, " ")
    .replace(/(^|[.!?]\s+|\n\s*\n)([a-z])/g, (_m, lead: string, ch: string) => lead + ch.toUpperCase())
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
