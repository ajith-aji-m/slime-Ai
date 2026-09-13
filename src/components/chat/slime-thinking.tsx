"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";
import { SlimeMark } from "@/components/ui";
import { THINKING_PHRASES } from "@/config/thinking-phrases";

export interface SlimeThinkingProps {
  /**
   * A real backend status (e.g. "Searching the web…", "Optimizing
   * response…" — see `router.ts`'s `{ type: "status" }` chunks). Shown
   * verbatim and never overridden. Omit while nothing real has arrived yet —
   * `SlimeThinking` then rotates through `THINKING_PHRASES` on its own so
   * the plain wait doesn't sit on a single static word the whole time.
   */
  label?: string;
  /** mascot size in px */
  size?: number;
  className?: string;
}

const ROTATE_MS = 1800;

/** Picks a random index into a `length`-item list that is never `current` —
 * so the rotation always visibly changes instead of occasionally reselecting
 * the same phrase. Pure/exported so this pick logic is unit-testable without
 * a component-rendering harness (this repo doesn't otherwise have one). A
 * list of 0 or 1 items has nothing to change to, so it just echoes back. */
export function nextPhraseIndex(current: number, length: number): number {
  if (length <= 1) return 0;
  const next = Math.floor(Math.random() * length);
  return next === current ? (next + 1) % length : next;
}

/** Cycles through `THINKING_PHRASES` every `ROTATE_MS` while `active`. Frozen
 * on the first phrase for `prefers-reduced-motion` users — cycling text is a
 * distraction the same global rule that stops the mascot's CSS animations is
 * meant to avoid, but a JS `setInterval` isn't covered by that CSS-only rule,
 * so it's checked here explicitly. */
function useRotatingPhrase(active: boolean): string {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!active || THINKING_PHRASES.length <= 1) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const id = setInterval(() => {
      setIndex((current) => nextPhraseIndex(current, THINKING_PHRASES.length));
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [active]);

  return THINKING_PHRASES[index] ?? "Thinking…";
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
  label,
  size = 24,
  className,
}: SlimeThinkingProps) {
  const rotating = useRotatingPhrase(label === undefined);
  const text = label ?? rotating;
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
      <span className="text-sm text-on-surface-variant">{text}</span>
    </span>
  );
}
