import type { HumanizerDiffSegment } from "@/types/humanizer";

/**
 * Word-level diff between two strings. Each token is a word plus the whitespace
 * that trails it, so tokens concatenate straight back into the original text
 * (no standalone spaces to leak into a highlight or a gap). A Longest Common
 * Subsequence over the token arrays produces the ops, which are then merged
 * into readable `equal` / `insert` / `delete` segments.
 *
 * The result is what the Humanizer preview highlights — every `insert` segment
 * is genuinely new wording, never a random pick.
 */

/** Above this combined token count we fall back to a line-level diff. */
const MAX_TOKENS = 6000;

/** "word + trailing whitespace" tokens; leading whitespace is dropped. */
function tokenize(input: string): string[] {
  return input.match(/\S+\s*/g) ?? [];
}

/** "line + its newline" tokens, for the large-input fallback. */
function lineTokens(input: string): string[] {
  return input.match(/[^\n]*\n|[^\n]+$/g) ?? [];
}

type Op = HumanizerDiffSegment["type"];

/** Classic DP LCS over two token arrays, returned as an op list. */
function lcsOps(a: string[], b: string[]): Op[] {
  const n = a.length;
  const m = b.length;
  const w = m + 1;
  const dp = new Int32Array((n + 1) * w);

  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      dp[i * w + j] =
        a[i] === b[j]
          ? dp[(i + 1) * w + (j + 1)] + 1
          : Math.max(dp[(i + 1) * w + j], dp[i * w + (j + 1)]);
    }
  }

  const ops: Op[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push("equal");
      i += 1;
      j += 1;
    } else if (dp[(i + 1) * w + j] >= dp[i * w + (j + 1)]) {
      ops.push("delete");
      i += 1;
    } else {
      ops.push("insert");
      j += 1;
    }
  }
  while (i < n) {
    ops.push("delete");
    i += 1;
  }
  while (j < m) {
    ops.push("insert");
    j += 1;
  }
  return ops;
}

function merge(ops: Op[], a: string[], b: string[]): HumanizerDiffSegment[] {
  const out: HumanizerDiffSegment[] = [];
  let ai = 0;
  let bi = 0;

  const push = (type: Op, text: string) => {
    if (!text) return;
    const prev = out[out.length - 1];
    if (prev && prev.type === type) prev.text += text;
    else out.push({ type, text });
  };

  for (const op of ops) {
    if (op === "equal") {
      push("equal", b[bi]);
      ai += 1;
      bi += 1;
    } else if (op === "delete") {
      push("delete", a[ai]);
      ai += 1;
    } else {
      push("insert", b[bi]);
      bi += 1;
    }
  }
  return out;
}

export function diffWords(
  original: string,
  humanized: string,
): HumanizerDiffSegment[] {
  const a = tokenize(original);
  const b = tokenize(humanized);
  if (a.length + b.length > MAX_TOKENS) {
    const la = lineTokens(original);
    const lb = lineTokens(humanized);
    return merge(lcsOps(la, lb), la, lb);
  }
  return merge(lcsOps(a, b), a, b);
}

/** Contiguous non-equal regions — an insert, a delete, or an adjacent pair. */
export function countChanges(segments: HumanizerDiffSegment[]): number {
  let count = 0;
  let inChange = false;
  for (const seg of segments) {
    if (seg.type === "equal") {
      inChange = false;
    } else if (!inChange) {
      count += 1;
      inChange = true;
    }
  }
  return count;
}

/** Contiguous `insert` regions — the spans the humanized preview highlights. */
export function countHighlights(segments: HumanizerDiffSegment[]): number {
  let count = 0;
  let inInsert = false;
  for (const seg of segments) {
    if (seg.type === "insert") {
      if (!inInsert) count += 1;
      inInsert = true;
    } else {
      inInsert = false;
    }
  }
  return count;
}
