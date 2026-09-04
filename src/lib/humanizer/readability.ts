import type { HumanizerReadability } from "@/types/humanizer";

/**
 * Flesch reading-ease + Flesch–Kincaid grade level. Both are simple, well-known
 * formulas over counts of sentences, words and (estimated) syllables. We only
 * report a score when there's enough text for it to mean something.
 */

/** Minimum words before a readability score is worth showing. */
export const READABILITY_MIN_WORDS = 40;

function countSentences(text: string): number {
  const matches = text.match(/[^.!?]+[.!?]+(?:["')\]]+)?/g);
  return Math.max(1, matches?.length ?? (text.trim() ? 1 : 0));
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const trimmed = w
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "")
    .replace(/^y/, "");
  const groups = trimmed.match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

export function readability(text: string): HumanizerReadability | undefined {
  const words = text.match(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g) ?? [];
  if (words.length < READABILITY_MIN_WORDS) return undefined;

  const sentences = countSentences(text);
  const syllables = words.reduce((n, w) => n + countSyllables(w), 0);
  const wordsPerSentence = words.length / sentences;
  const syllablesPerWord = syllables / words.length;

  const readingEase =
    206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  const gradeLevel =
    0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  return {
    readingEase: Math.round(clamp(readingEase, 0, 100) * 10) / 10,
    gradeLevel: Math.round(Math.max(0, gradeLevel) * 10) / 10,
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Short human label for a reading-ease score. */
export function readingEaseLabel(score: number): string {
  if (score >= 80) return "Very easy";
  if (score >= 60) return "Plain English";
  if (score >= 45) return "Fairly hard";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}
