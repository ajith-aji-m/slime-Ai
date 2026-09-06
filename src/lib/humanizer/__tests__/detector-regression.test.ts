import { describe, it, expect } from "vitest";
import { mockHumanize } from "../mock";
import { analyzeHumanization } from "../analyze";

/**
 * Guards the specific bug this file exists to prevent: the mock rewriter's
 * output scoring as high (or higher) on the detector heuristic as the
 * original AI-generated text it started from. Two things caused that in
 * practice — both covered here so a regression fails loudly instead of
 * silently shipping a "humanizer" that doesn't:
 *  - inflected AI-tell words ("utilized", "leveraging", …) not matching the
 *    bare-infinitive-only substitution regexes, so the tell survived intact
 *  - a stray `\n` (a wrapped line, not a paragraph break) being treated as a
 *    sentence boundary, corrupting capitalization and reading unnaturally
 */

const HEAVY_AI_TELL_SAMPLE = `Artificial intelligence has rapidly transformed the way businesses operate
in recent years. It is important to note that companies across various
industries are leveraging AI to streamline operations, enhance customer
experiences, and drive innovation. Furthermore, the integration of machine
learning algorithms has enabled organizations to analyze vast amounts of
data with unprecedented speed and accuracy. Moreover, AI-powered tools are
being utilized to automate repetitive tasks, allowing employees to focus on
more strategic initiatives. In conclusion, the adoption of AI technology
is not merely a trend but a fundamental shift in how businesses approach
problem-solving and decision-making in the modern era.`;

const CORPORATE_WE_VOICE_SAMPLE = `Our team is excited to announce that we have leveraged cutting-edge
technology to facilitate a seamless onboarding experience for new users.
It is important to note that this update demonstrates our commitment to
innovation. We believe our customers will benefit greatly from these
changes, and we recommend exploring the new dashboard at your earliest
convenience. Additionally, our support team is available around the clock
to assist with any questions you may have about the platform.`;

describe("Humanizer detector: mock rewrite lowers the AI-likelihood score", () => {
  it.each([
    ["heavy AI-tell phrasing", HEAVY_AI_TELL_SAMPLE],
    ["corporate we-voice phrasing", CORPORATE_WE_VOICE_SAMPLE],
  ])("%s scores well below the original after rewriting", (_label, original) => {
    const humanized = mockHumanize(original);
    const { detector } = analyzeHumanization(original, humanized);
    expect(detector).toBeDefined();

    // the rewrite must score meaningfully lower than the untouched original —
    // this is the whole point of the tool
    expect(detector!.humanized.score).toBeLessThan(detector!.original.score);

    // and land at or below "mixed", not still read as clearly AI-generated
    expect(detector!.humanized.score).toBeLessThanOrEqual(50);
    expect(detector!.humanized.verdict).not.toBe("likely-ai");
  });

  it("does not leave inflected AI-tell words unsubstituted", () => {
    const humanized = mockHumanize(HEAVY_AI_TELL_SAMPLE);
    expect(humanized.toLowerCase()).not.toContain("utilized");
    expect(humanized.toLowerCase()).not.toContain("leveraging");
  });

  it("does not capitalize mid-sentence words at a wrapped line break", () => {
    const humanized = mockHumanize(
      "This sentence wraps across a line\nbreak but keeps going regardless.",
    );
    expect(humanized).not.toContain("\nBreak");
    expect(humanized).toContain("\nbreak");
  });
});
