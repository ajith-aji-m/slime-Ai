import { describe, it, expect } from "vitest";
import {
  CATEGORY_ROUTING,
  CATEGORY_SAMPLING,
  TASK_CATEGORIES,
  TOOL_MODE_CATEGORY,
} from "@/config/ai-router";
import { DEFAULT_GROQ_MODELS, DEFAULT_NVIDIA_MODELS } from "@/config/models";

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

describe("auto-title routing", () => {
  it("routes the title category to the fast role first", () => {
    // Titling is a cheap background task (a few words, nothing streamed to
    // the user mid-flight) — it shouldn't cost a flagship-model call.
    expect(TASK_CATEGORIES).toContain("title");
    expect(CATEGORY_ROUTING.title[0]).toBe("slime-fast");
  });

  it("lowers sampling temperature for titles", () => {
    // A title has one reasonable answer per conversation — low temperature
    // keeps it literal instead of a creative riff on the topic.
    expect(CATEGORY_SAMPLING.title?.temperature).toBeLessThan(0.7);
  });
});

describe("provider switch — NVIDIA/Groq registries stay interchangeable", () => {
  it("every text-routable role CATEGORY_ROUTING can name exists in both registries", () => {
    // The whole point of sharing a role-id namespace (see DEFAULT_GROQ_MODELS'
    // comment in config/models.ts) is that switching AI_PROVIDER never means
    // switching routing policy. If a role referenced by CATEGORY_ROUTING only
    // existed in one registry, that category would silently lose its
    // preferred model the moment the other provider became active.
    const nvidiaIds = new Set(DEFAULT_NVIDIA_MODELS.map((m) => m.id));
    const groqIds = new Set(DEFAULT_GROQ_MODELS.map((m) => m.id));
    const referenced = new Set(TASK_CATEGORIES.flatMap((c) => CATEGORY_ROUTING[c]));

    for (const id of referenced) {
      expect(nvidiaIds, `"${id}" missing from DEFAULT_NVIDIA_MODELS`).toContain(id);
      expect(groqIds, `"${id}" missing from DEFAULT_GROQ_MODELS`).toContain(id);
    }
  });

  it("neither registry's default set claims real image generation", () => {
    // Image Gen stays NVIDIA-specific and gated on a real `endpoint` by
    // design (see router.ts's routeImageGeneration) — a default entry
    // claiming `image: true` without that would be inventing a capability.
    expect(DEFAULT_NVIDIA_MODELS.some((m) => m.image)).toBe(false);
    expect(DEFAULT_GROQ_MODELS.some((m) => m.image)).toBe(false);
  });
});
