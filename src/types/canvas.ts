/**
 * Canvas domain model. A Canvas artifact is a substantial, structured output the
 * assistant produced (code, HTML, a table, a report, a generated image) that is
 * better shown in the dedicated Canvas workspace than dumped into the chat
 * thread. Artifacts are *derived* from completed assistant messages — they are
 * not a new kind of stored message part, so chat history stays untouched.
 */

import type { IconName } from "@/components/ui/icon";

export type CanvasArtifactType = "code" | "html" | "table" | "report" | "image";

export interface CanvasArtifact {
  /** deterministic: `${messageId}:${partIndex}` so re-derivation is idempotent */
  id: string;
  type: CanvasArtifactType;
  /** short human label, e.g. a filename or the report title */
  title: string;
  conversationId: string;
  messageId: string;
  createdAt: string;

  /** code / html */
  language?: string;
  code?: string;

  /** html */
  html?: string;

  /** table / report (GitHub-flavoured Markdown) */
  markdown?: string;

  /** image */
  imageUrl?: string;
  imagePrompt?: string;

  /** safe, user-useful metadata shown in the Canvas header/side */
  meta?: Record<string, string | number>;
}

/** Compact in-chat stand-in for an artifact that lives in Canvas. */
export interface CanvasArtifactRef {
  id: string;
  type: CanvasArtifactType;
  title: string;
  subtitle?: string;
  /** short lead-in shown for report artifacts so the chat still has a summary */
  teaser?: string;
}

export const CANVAS_TYPE_LABEL: Record<CanvasArtifactType, string> = {
  code: "Code",
  html: "HTML",
  table: "Table",
  report: "Report",
  image: "Image",
};

export const CANVAS_TYPE_ICON: Record<CanvasArtifactType, IconName> = {
  code: "code_blocks",
  html: "web",
  table: "table_chart",
  report: "article",
  image: "image",
};
