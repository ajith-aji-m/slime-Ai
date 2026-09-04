/**
 * Humanizer domain model. The Humanizer tool rewrites AI-generated text into
 * natural, human-sounding writing while preserving meaning, facts and keywords.
 * A `HumanizerAnalysis` is *derived* from the (original, humanized) text pair —
 * it is never stored on a message, only attached to a derived Canvas artifact.
 */

/** One span of a word-level diff between the original and the humanized text. */
export interface HumanizerDiffSegment {
  /** `equal` = unchanged · `insert` = new wording · `delete` = removed wording */
  type: "equal" | "insert" | "delete";
  text: string;
}

export type HumanizerKeywordKind = "entity" | "number" | "citation" | "term";

export interface HumanizerKeyword {
  /** surface form, in the casing it first appeared with in the original */
  text: string;
  kind: HumanizerKeywordKind;
  /** how many times it occurs in the original */
  count: number;
  /** still present (case-insensitive, whole word) in the humanized text */
  preserved: boolean;
}

export interface HumanizerReadability {
  /** Flesch reading ease (0–100, higher = easier) */
  readingEase: number;
  /** Flesch–Kincaid grade level */
  gradeLevel: number;
}

export interface HumanizerAnalysis {
  /** full word-level diff, in reading order */
  segments: HumanizerDiffSegment[];
  /** contiguous changed regions (an insert, a delete, or an insert+delete pair) */
  changeCount: number;
  /** highlighted spans in the humanized output (contiguous `insert` regions) */
  highlightCount: number;
  keywords: HumanizerKeyword[];
  /** keywords from the original that are missing from the humanized text */
  droppedKeywords: string[];
  /** only computed when both texts are long enough to score reliably */
  readability?: {
    original: HumanizerReadability;
    humanized: HumanizerReadability;
  };
  stats: {
    originalWords: number;
    humanizedWords: number;
    /** signed % change in word count, rounded */
    wordDeltaPct: number;
  };
}
