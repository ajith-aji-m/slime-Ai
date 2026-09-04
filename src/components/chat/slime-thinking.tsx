"use client";

import { cn } from "@/lib/utils/cn";
import { SlimeMark } from "@/components/ui";

export interface SlimeThinkingProps {
  /** shown next to the mascot — defaults to "Thinking…" */
  label?: string;
  /** mascot size in px */
  size?: number;
  className?: string;
}

/**
 * Inline "AI is thinking" indicator — a small floating, softly glowing slime
 * (the existing brand mark, `SlimeMark`) instead of a generic spinner/dots.
 * Recolours in lock-step with the active tool mode via the same
 * `--sl-slime-*` / `--sl-mode-glow` variables the rest of the mascot and
 * per-mode accents use (see `globals.css`), and is transform/opacity-only so
 * it stays cheap on mobile and collapses to a calm static glow under
 * `prefers-reduced-motion` (handled globally, no extra work needed here).
 *
 * Swap in for the plain "Thinking…" row while an assistant message is
 * streaming with no content yet; disappears as soon as content/parts arrive.
 */
export function SlimeThinking({
  label = "Thinking…",
  size = 24,
  className,
}: SlimeThinkingProps) {
  const haloSize = size + 18;
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden
        className="relative inline-flex shrink-0 items-center justify-center"
        style={{ width: haloSize, height: haloSize }}
      >
        <span className="sl-thinking-glow absolute inset-0 rounded-full" />
        <span className="sl-thinking-particle sl-thinking-particle--1" />
        <span className="sl-thinking-particle sl-thinking-particle--2" />
        <span className="sl-thinking-particle sl-thinking-particle--3" />
        <SlimeMark size={size} className="sl-thinking-float relative" />
      </span>
      <span className="text-sm text-on-surface-variant">{label}</span>
    </span>
  );
}
