import "server-only";

type RouterEvent =
  | "request"
  | "attempt"
  | "success"
  | "fallback"
  | "permanent_error"
  | "midstream_fail"
  | "exhausted";

interface RouterLogFields {
  event: RouterEvent;
  category?: string;
  /** internal role id — never an upstream model id */
  role?: string;
  fromRole?: string;
  toRole?: string;
  reason?: string;
  errorCategory?: "recoverable" | "permanent";
  attempt?: number;
  attempts?: number;
  durationMs?: number;
}

const KEYISH = /(key|secret|token|authorization|bearer|nvapi)/i;

/**
 * Structured router logging for development + debugging only. Silent in
 * production. Only ever receives ids, categories, reasons and timings — but
 * scrubs anything key-shaped defensively before printing.
 */
export function routerLog(fields: RouterLogFields): void {
  if (process.env.NODE_ENV === "production") return;

  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (KEYISH.test(k)) continue;
    if (typeof v === "string" && (KEYISH.test(v) || v.length > 200)) continue;
    safe[k] = v;
  }

  console.info(
    `[ai-router] ${new Date().toISOString()} ${JSON.stringify(safe)}`,
  );
}
