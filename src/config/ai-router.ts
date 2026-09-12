/**
 * Internal AI routing policy. Users never see any of this — the composer only
 * ever says "Slime AI". This file is the single place that decides which
 * *internal* model role handles which kind of task, and how far to fall back.
 *
 * Upstream (NVIDIA) model ids live in `src/config/models.ts` / the `NVIDIA_MODELS`
 * env var — never hard-coded here or anywhere else.
 */

import type { ToolId } from "@/types/chat";

export type TaskCategory =
  | "general"
  | "search"
  | "coding"
  | "long_context"
  | "reasoning"
  | "research"
  | "structured"
  | "humanize";

export const TASK_CATEGORIES: TaskCategory[] = [
  "general",
  "search",
  "coding",
  "long_context",
  "reasoning",
  "research",
  "structured",
  "humanize",
];

/**
 * Ordered list of internal model roles to try for each task category. The first
 * entry is the primary; the rest are fallbacks in preference order. Roles that
 * don't resolve to a configured model are skipped at runtime, and any remaining
 * configured models are appended as last-resort fallbacks.
 */
export const CATEGORY_ROUTING: Record<TaskCategory, string[]> = {
  general: ["slime-general", "slime-versatile", "slime-fast"],
  search: ["slime-fast", "slime-general", "slime-versatile"],
  coding: ["slime-versatile", "slime-general", "slime-fast"],
  long_context: ["slime-reasoning", "slime-general", "slime-versatile"],
  reasoning: ["slime-reasoning", "slime-versatile", "slime-general"],
  research: ["slime-reasoning", "slime-versatile", "slime-general"],
  structured: ["slime-general", "slime-versatile", "slime-fast"],
  // The Humanizer rewrite needs a model that reliably follows a long list of
  // precise structural constraints (sentence-length variance, no repeated
  // connectors, no parallel triads) — that is fundamentally an
  // instruction-following task, not just a "sounds natural" style match, so
  // the flagship generalist goes first. `slime-humanizer` (see models.ts,
  // `mistralai/mistral-nemotron`) was originally tried as the primary pick
  // for its naturally fluent, less stiffly-formal style, but real-world
  // testing found it did not reliably apply the structural rules (still
  // produced uniform sentence lengths and reused "Furthermore,"); it stays
  // second as a fallback rather than being removed, since its prose style is
  // still a reasonable fit if the flagship is ever unavailable.
  humanize: ["slime-general", "slime-humanizer", "slime-versatile"],
};

/**
 * Maps a composer "mode" tool straight to its task category — the router
 * trusts an explicit mode over text heuristics. `image_gen` is deliberately
 * absent: it never resolves to a text category, it's routed to an
 * image-capable model only (see `routeChat`'s image branch) or rejected.
 */
export const TOOL_MODE_CATEGORY: Partial<Record<ToolId, TaskCategory>> = {
  web_search: "search",
  code: "coding",
  research: "research",
  // Rewriting AI text gets its own category so it's routed to
  // `slime-humanizer` specifically (see models.ts) instead of whichever
  // generalist everyday chat lands on. The Humanizer instruction still rides
  // as a system message (see `buildHumanizerMessages`), not a new provider.
  humanizer: "humanize",
  // Turning a rough idea into a well-structured prompt is a templated,
  // formatting-heavy task — same "structured" category as other
  // fixed-shape-output work. Instruction rides as a system message (see
  // `buildPromptGeneratorMessages`), not a new provider.
  prompt_generator: "structured",
};

/**
 * Total attempts (primary + fallbacks) the router will make for one request.
 * Caps API usage and prevents fallback loops. Overridable with AI_MAX_FALLBACKS.
 */
export const DEFAULT_MAX_ATTEMPTS = 3;

export function maxAttempts(): number {
  const raw = Number(process.env.AI_MAX_FALLBACKS);
  return Number.isFinite(raw) && raw >= 1 && raw <= 6
    ? Math.floor(raw)
    : DEFAULT_MAX_ATTEMPTS;
}

/** Rough chars→tokens divisor for context-window fitting. */
export const CHARS_PER_TOKEN = 3.6;

/** Inputs longer than this (chars) are treated as long-context tasks. */
export const LONG_CONTEXT_CHARS = 24_000;

export interface SamplingParams {
  /** OpenAI-compatible sampling temperature. Provider default is 0.7. */
  temperature?: number;
  /** Penalizes tokens already used verbatim (0–2). Provider default: none. */
  frequencyPenalty?: number;
  /** Penalizes tokens already used at all (0–2). Provider default: none. */
  presencePenalty?: number;
}

/**
 * Per-category sampling overrides layered on top of the provider default
 * (temperature 0.7, no penalties). Everything except `humanize` is left
 * alone here deliberately — this is a purely additive, opt-in override, not
 * a change to how everyday chat/coding/search sound.
 *
 * `humanize` is the one category where the default is wrong: a low,
 * conservative temperature with no repetition penalty produces exactly the
 * low-perplexity, low-burstiness token pattern AI-content detectors key on —
 * the same small set of "safe" connectors and vocabulary, chosen the same
 * way every time. Raising temperature and adding a frequency penalty pushes
 * the rewrite toward more varied, less predictable word choices (breaking up
 * repeated connectors and AI-favorite vocabulary at the token level, not
 * just via the system prompt's wording) without the model losing coherence
 * at this range.
 */
export const CATEGORY_SAMPLING: Partial<Record<TaskCategory, SamplingParams>> = {
  humanize: { temperature: 0.95, frequencyPenalty: 0.6, presencePenalty: 0.3 },
};
