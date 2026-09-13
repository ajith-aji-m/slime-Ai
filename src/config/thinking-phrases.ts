/**
 * Playful, on-brand filler words `SlimeThinking` rotates through while an
 * assistant message is streaming with no content yet AND no real backend
 * status has arrived (see `router.ts`'s `{ type: "status" }` chunks, e.g.
 * "Searching the web…", "Optimizing response…" on a fallback). Purely
 * cosmetic — a real status label always wins and is never overridden by
 * this list. Kept vague/generic on purpose: nothing here should claim a
 * specific capability (no "Searching…", no "Reasoning…") the app can't
 * actually confirm is happening for this request.
 */
export const THINKING_PHRASES: string[] = [
  "Thinking…",
  "Slime is thinking…",
  "Slime is preparing…",
  "Optimizing…",
  "Gathering thoughts…",
  "Connecting the dots…",
  "Warming up…",
  "Slime is on it…",
  "Composing a reply…",
  "Stirring up an answer…",
  "Almost there…",
];
