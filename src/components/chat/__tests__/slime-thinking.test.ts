import { describe, it, expect } from "vitest";
import { nextPhraseIndex } from "../slime-thinking";
import { THINKING_PHRASES } from "@/config/thinking-phrases";

describe("nextPhraseIndex", () => {
  it("never repeats the current index when there is more than one phrase", () => {
    for (let current = 0; current < 20; current += 1) {
      for (let trial = 0; trial < 50; trial += 1) {
        const next = nextPhraseIndex(current % 5, 5);
        expect(next).not.toBe(current % 5);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThan(5);
      }
    }
  });

  it("has nothing to change to with 0 or 1 phrases, so it echoes back 0", () => {
    expect(nextPhraseIndex(0, 0)).toBe(0);
    expect(nextPhraseIndex(0, 1)).toBe(0);
  });
});

describe("THINKING_PHRASES", () => {
  it("has more than one on-brand filler phrase to rotate through", () => {
    expect(THINKING_PHRASES.length).toBeGreaterThan(1);
    for (const phrase of THINKING_PHRASES) {
      expect(phrase.length).toBeGreaterThan(0);
    }
  });

  it("never claims a specific capability the app can't confirm is happening", () => {
    // These belong to real backend status chunks (router.ts) only — the
    // rotation is generic filler and must not collide with a real signal.
    const claims = [/search/i, /reasoning/i, /web/i];
    for (const phrase of THINKING_PHRASES) {
      for (const claim of claims) {
        expect(phrase).not.toMatch(claim);
      }
    }
  });
});
