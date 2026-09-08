import { describe, it, expect } from "vitest";
import { CATEGORY_ROUTING, TOOL_MODE_CATEGORY } from "@/config/ai-router";
import { DEFAULT_NVIDIA_MODELS } from "@/config/models";

describe("humanizer routing", () => {
  it("routes humanizer tool to the humanize category, led by slime-humanizer", () => {
    expect(TOOL_MODE_CATEGORY.humanizer).toBe("humanize");
    expect(CATEGORY_ROUTING.humanize[0]).toBe("slime-humanizer");
  });

  it("slime-humanizer is registered with the expected upstream model", () => {
    const model = DEFAULT_NVIDIA_MODELS.find((m) => m.id === "slime-humanizer");
    expect(model).toBeDefined();
    expect(model?.upstreamId).toBe("mistralai/mistral-nemotron");
  });
});
