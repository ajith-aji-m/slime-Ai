import { describe, it, expect } from "vitest";
import { estimateAiLikelihood } from "../detector";

const AI_ISH = `
Furthermore, it is important to note that in today's digital age, businesses
must leverage robust, seamless solutions to unlock their full potential.
Moreover, this approach boasts a wide range of benefits. In conclusion, the
landscape of modern technology continues to evolve, and this testament to
innovation cannot be overstated. Additionally, teams should utilize these
tools to elevate their workflow and delve into new opportunities.
`.repeat(2);

const HUMAN_ISH = `
I didn't expect the meeting to run so long, but honestly, it was worth it.
We laughed, we argued about the budget for a solid ten minutes, and somehow
still finished early. My coffee went cold twice. Next time I'll bring a
thermos. Can't say I've ever had a Tuesday like that one before, and I'm
not sure I want another.
`.repeat(2);

describe("estimateAiLikelihood", () => {
  it("returns undefined for very short text", () => {
    expect(estimateAiLikelihood("Too short.")).toBeUndefined();
  });

  it("scores stock-LLM-phrased text higher than casual human writing", () => {
    const aiEstimate = estimateAiLikelihood(AI_ISH);
    const humanEstimate = estimateAiLikelihood(HUMAN_ISH);
    expect(aiEstimate).toBeDefined();
    expect(humanEstimate).toBeDefined();
    expect(aiEstimate!.score).toBeGreaterThan(humanEstimate!.score);
    expect(aiEstimate!.verdict).toBe("likely-ai");
    expect(humanEstimate!.verdict).not.toBe("likely-ai");
  });

  it("surfaces the stock-phrasing signal when present", () => {
    const estimate = estimateAiLikelihood(AI_ISH)!;
    expect(
      estimate.signals.some((s) => s.label.includes("Stock AI phrasing")),
    ).toBe(true);
  });
});
