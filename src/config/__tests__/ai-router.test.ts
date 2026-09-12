import { describe, it, expect } from "vitest";
import { CATEGORY_ROUTING, TOOL_MODE_CATEGORY } from "@/config/ai-router";
import { DEFAULT_NVIDIA_MODELS } from "@/config/models";

describe("humanizer routing", () => {
  it("routes humanizer tool to the humanize category, led by the flagship generalist", () => {
    // slime-general goes first: the Humanizer's structural rules (sentence-
    // length variance, no repeated connectors, no parallel triads) are an
    // instruction-following problem the flagship handles more reliably than
    // slime-humanizer did in practice (see ai-router.ts). slime-humanizer
    // stays registered as the second-choice fallback, not dropped.
    expect(TOOL_MODE_CATEGORY.humanizer).toBe("humanize");
    expect(CATEGORY_ROUTING.humanize[0]).toBe("slime-general");
    expect(CATEGORY_ROUTING.humanize).toContain("slime-humanizer");
  });

  it("slime-humanizer is registered with the expected upstream model", () => {
    const model = DEFAULT_NVIDIA_MODELS.find((m) => m.id === "slime-humanizer");
    expect(model).toBeDefined();
    expect(model?.upstreamId).toBe("mistralai/mistral-nemotron");
  });
});
