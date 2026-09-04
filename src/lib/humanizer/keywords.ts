import type { HumanizerKeyword, HumanizerKeywordKind } from "@/types/humanizer";

/**
 * Best-effort keyword extraction for the Humanizer. The goal is narrow: surface
 * the SEO / technical / product / brand / domain terms a content writer must
 * check survived the rewrite — not a full NLP keyphrase model.
 */

const STOPWORDS = new Set(
  (
    "the a an and or but if then else of to in on at by for with from into over " +
    "as is are was were be been being it its this that these those i you he she " +
    "we they them his her our your their not no nor so than too very can will " +
    "just should now also may might must have has had do does did done about " +
    "which who whom what when where why how all any both each few more most other " +
    "some such only own same up out off down there here"
  ).split(" "),
);

const CITATION_RE = /\[\d+\]|\([A-Z][A-Za-z.'-]+(?:\s+(?:et al\.?|and|&)\s+[A-Z][A-Za-z.'-]+)*,?\s*\d{4}[a-z]?\)/g;
const NUMERIC_RE =
  /^(?:\$€£¥)?\d[\d,.]*(?:%|k|m|bn|x)?$|^\d{4}$|^v?\d+\.\d+(?:\.\d+)?$/i;

function wordList(text: string): string[] {
  return text.match(/[A-Za-z0-9][A-Za-z0-9'.+#/-]*/g) ?? [];
}

/** Whole-word, case-insensitive presence test. */
function occurs(needle: string, haystack: string): boolean {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\w])${escaped}(?:$|[^\\w])`, "i").test(haystack);
}

interface Candidate {
  text: string;
  kind: HumanizerKeywordKind;
  count: number;
}

export function extractKeywords(
  original: string,
  humanized = "",
  limit = 16,
): HumanizerKeyword[] {
  const found = new Map<string, Candidate>();
  const add = (raw: string, kind: HumanizerKeywordKind) => {
    const text = raw.trim();
    if (!text) return;
    const key = text.toLowerCase();
    const existing = found.get(key);
    if (existing) {
      existing.count += 1;
      // A more specific kind wins (citation > number > entity > term).
      return;
    }
    found.set(key, { text, kind, count: 1 });
  };

  // 1. Citations — keep these verbatim, always.
  for (const m of original.match(CITATION_RE) ?? []) add(m, "citation");

  // 2. Multi-word proper-noun phrases + acronyms + standalone capitalised terms.
  const properPhrase = /\b([A-Z][A-Za-z0-9.+&#-]*(?:\s+(?:[A-Z][A-Za-z0-9.+&#-]*|of|the|and|&)){0,3})\b/g;
  let pm: RegExpExecArray | null;
  while ((pm = properPhrase.exec(original)) !== null) {
    const phrase = pm[1].replace(/\s+(of|the|and|&)$/i, "").trim();
    if (phrase.length < 2) continue;
    const words = phrase.split(/\s+/);
    // Skip a lone capitalised word that's only capitalised as a sentence start.
    if (words.length === 1) {
      const before = original.slice(0, pm.index).trimEnd();
      const sentenceStart = before === "" || /[.!?:]$/.test(before);
      const isAcronym = /^[A-Z0-9]{2,}$/.test(phrase);
      if (sentenceStart && !isAcronym) continue;
      if (STOPWORDS.has(phrase.toLowerCase())) continue;
    }
    add(phrase, "entity");
  }

  // 3. Numbers, money, percentages, versions, years.
  for (const w of wordList(original)) {
    if (NUMERIC_RE.test(w)) add(w, "number");
  }

  // 4. Frequent domain terms (lowercase nouns that repeat).
  const freq = new Map<string, number>();
  for (const w of wordList(original)) {
    const lw = w.toLowerCase();
    if (lw.length < 4 || STOPWORDS.has(lw) || /\d/.test(lw)) continue;
    if (found.has(lw)) continue;
    freq.set(lw, (freq.get(lw) ?? 0) + 1);
  }
  for (const [term, count] of freq) {
    if (count >= 2) add(term, "term");
  }

  const kindRank: Record<HumanizerKeywordKind, number> = {
    citation: 0,
    number: 1,
    entity: 2,
    term: 3,
  };

  return [...found.values()]
    .sort(
      (a, b) =>
        kindRank[a.kind] - kindRank[b.kind] ||
        b.count - a.count ||
        a.text.localeCompare(b.text),
    )
    .slice(0, limit)
    .map((c) => ({
      text: c.text,
      kind: c.kind,
      count: c.count,
      preserved: humanized ? occurs(c.text, humanized) : true,
    }));
}
