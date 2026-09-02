/**
 * Internal AI routing policy. Users never see any of this — the composer only
 * ever says "Slime AI". This file is the single place that decides which
 * *internal* model role handles which kind of task, and how far to fall back.
 *
 * Upstream (NVIDIA) model ids live in `src/config/models.ts` / the `NVIDIA_MODELS`
 * env var — never hard-coded here or anywhere else.
 */

export type TaskCategory =
  | "general"
  | "coding"
  | "long_context"
  | "reasoning"
  | "research"
  | "structured";

export const TASK_CATEGORIES: TaskCategory[] = [
  "general",
  "coding",
  "long_context",
  "reasoning",
  "research",
  "structured",
];

/**
 * Ordered list of internal model roles to try for each task category. The first
 * entry is the primary; the rest are fallbacks in preference order. Roles that
 * don't resolve to a configured model are skipped at runtime, and any remaining
 * configured models are appended as last-resort fallbacks.
 */
export const CATEGORY_ROUTING: Record<TaskCategory, string[]> = {
  general: ["slime-general", "slime-versatile", "slime-fast"],
  coding: ["slime-general", "slime-versatile", "slime-reasoning"],
  long_context: ["slime-versatile", "slime-reasoning", "slime-general"],
  reasoning: ["slime-reasoning", "slime-versatile", "slime-general"],
  research: ["slime-reasoning", "slime-versatile", "slime-general"],
  structured: ["slime-general", "slime-versatile", "slime-fast"],
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
