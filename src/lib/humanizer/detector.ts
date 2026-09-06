import type {
  HumanizerDetectorEstimate,
  HumanizerDetectorSignal,
} from "@/types/humanizer";

/**
 * A **local, heuristic** estimate of how "AI-written" a piece of text reads —
 * never a call to a real AI-detector service (there isn't one wired up, and
 * per this app's "never fake a capability" rule we don't pretend there is).
 * It scores the same stylistic tells real detectors are known to key off —
 * stock LLM phrasing, unusually uniform sentence lengths ("burstiness"),
 * repeated wording, and an absence of the small informal touches (contractions,
 * first person) human writing tends to have — and turns them into a rough
 * 0–100 "reads like AI" score plus the signals that drove it, so the Humanizer
 * report can show *why*, not just a number, and to keep it honest as a
 * self-check rather than a guarantee any real detector will agree.
 */

/** Minimum words before an estimate is worth showing — same spirit as `READABILITY_MIN_WORDS`. */
export const DETECTOR_MIN_WORDS = 20;

// Phrasing that shows up disproportionately often in unedited LLM output.
// Not exhaustive — a moving target — just the highest-signal, lowest-noise set.
const AI_TELLS = [
  "furthermore",
  "moreover",
  "in conclusion",
  "in summary",
  "it is important to note",
  "it's important to note",
  "it is worth noting",
  "delve into",
  "delve",
  "boasts",
  "robust",
  "seamless",
  "seamlessly",
  "leverage",
  "utilize",
  "in essence",
  "on the other hand",
  "as an ai",
  "note that",
  "unlock",
  "unleash",
  "landscape",
  "tapestry",
  "testament to",
  "plays a crucial role",
  "cannot be overstated",
  "in the realm of",
  "elevate",
  "game-changer",
  "top-notch",
  "in today's digital age",
  "fast-paced world",
  "ever-evolving",
  "in the world of",
  "when it comes to",
];

const CONTRACTIONS =
  /\b\w+'(?:t|re|ve|ll|d|s|m)\b/gi;

function words(text: string): string[] {
  return text.match(/[A-Za-z0-9]+(?:'[A-Za-z]+)?/g) ?? [];
}

function sentences(text: string): string[] {
  return (text.match(/[^.!?]+[.!?]+(?:["')\]]+)?/g) ?? [text]).filter((s) =>
    s.trim(),
  );
}

function mean(ns: number[]): number {
  return ns.reduce((a, b) => a + b, 0) / (ns.length || 1);
}

function stdev(ns: number[]): number {
  const m = mean(ns);
  return Math.sqrt(mean(ns.map((n) => (n - m) ** 2)));
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

export function estimateAiLikelihood(
  text: string,
): HumanizerDetectorEstimate | undefined {
  const ws = words(text);
  if (ws.length < DETECTOR_MIN_WORDS) return undefined;

  const signals: HumanizerDetectorSignal[] = [];
  let score = 50;

  // 1. Stock LLM phrasing — the highest-confidence signal, weighted hardest.
  const lower = text.toLowerCase();
  const tellHits = AI_TELLS.filter((tell) => lower.includes(tell));
  if (tellHits.length > 0) {
    const weight = Math.min(30, tellHits.length * 8);
    score += weight;
    signals.push({
      label: `Stock AI phrasing (${tellHits.slice(0, 3).join(", ")}${tellHits.length > 3 ? ", …" : ""})`,
      weight,
    });
  }

  // 2. Sentence-length burstiness — human writing mixes short and long
  // sentences; a low coefficient of variation (very uniform lengths) reads
  // as machine-paced.
  const sentenceLens = sentences(text).map((s) => words(s).length);
  if (sentenceLens.length >= 3) {
    const cv = stdev(sentenceLens) / (mean(sentenceLens) || 1);
    const uniformity = clamp(1 - cv, 0, 1); // 0 = bursty/human, 1 = uniform/AI
    const weight = Math.round((uniformity - 0.4) * 25); // only counts past a threshold
    if (weight !== 0) {
      score += weight;
      signals.push({
        label:
          weight > 0
            ? "Sentence lengths are unusually uniform"
            : "Sentence lengths vary naturally",
        weight,
      });
    }
  }

  // 3. Contractions / first person — small human-writing tells; their
  // absence nudges the score up, their presence nudges it down.
  const contractionCount = (text.match(CONTRACTIONS) ?? []).length;
  const per100 = (contractionCount / ws.length) * 100;
  if (per100 < 0.3) {
    score += 8;
    signals.push({ label: "No contractions", weight: 8 });
  } else if (per100 > 1.5) {
    score -= 8;
    signals.push({ label: "Uses contractions naturally", weight: -8 });
  }

  // 4. Repeated exact word choice — lexical diversity over a rolling window,
  // since raw type-token ratio drifts with length.
  const windowSize = Math.min(100, ws.length);
  const window = ws.slice(0, windowSize).map((w) => w.toLowerCase());
  const uniqueRatio = new Set(window).size / windowSize;
  if (uniqueRatio < 0.55) {
    score += 6;
    signals.push({ label: "Repeats the same wording often", weight: 6 });
  }

  score = Math.round(clamp(score, 0, 100));
  const verdict: HumanizerDetectorEstimate["verdict"] =
    score < 35 ? "likely-human" : score < 65 ? "mixed" : "likely-ai";

  return {
    score,
    verdict,
    signals: signals.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
  };
}

/** Short label for the score, for compact display. */
export function detectorVerdictLabel(
  verdict: HumanizerDetectorEstimate["verdict"],
): string {
  switch (verdict) {
    case "likely-human":
      return "Likely reads as human";
    case "mixed":
      return "Mixed signals";
    case "likely-ai":
      return "Likely flagged as AI";
  }
}
