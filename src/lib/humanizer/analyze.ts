import type { HumanizerAnalysis } from "@/types/humanizer";
import { countChanges, countHighlights, diffWords } from "./diff";
import { extractKeywords } from "./keywords";
import { readability } from "./readability";
import { estimateAiLikelihood } from "./detector";
import { checkFirstPersonPlural } from "./voice";

function wordCount(text: string): number {
  return (text.match(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g) ?? []).length;
}

/**
 * Turns an (original, humanized) text pair into everything the Humanizer
 * preview + report need: the word-level diff, change/highlight counts, the
 * preserved-keyword check and readability for both versions.
 */
export function analyzeHumanization(
  original: string,
  humanized: string,
): HumanizerAnalysis {
  const segments = diffWords(original, humanized);
  const keywords = extractKeywords(original, humanized);

  const originalWords = wordCount(original);
  const humanizedWords = wordCount(humanized);

  const origScore = readability(original);
  const humanScore = readability(humanized);

  const origDetector = estimateAiLikelihood(original);
  const humanDetector = estimateAiLikelihood(humanized);

  return {
    segments,
    changeCount: countChanges(segments),
    highlightCount: countHighlights(segments),
    keywords,
    droppedKeywords: keywords.filter((k) => !k.preserved).map((k) => k.text),
    voiceCheck: checkFirstPersonPlural(humanized),
    readability:
      origScore && humanScore
        ? { original: origScore, humanized: humanScore }
        : undefined,
    detector:
      origDetector && humanDetector
        ? { original: origDetector, humanized: humanDetector }
        : undefined,
    stats: {
      originalWords,
      humanizedWords,
      wordDeltaPct:
        originalWords > 0
          ? Math.round(((humanizedWords - originalWords) / originalWords) * 100)
          : 0,
    },
  };
}
