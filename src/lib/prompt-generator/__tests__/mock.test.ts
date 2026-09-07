import { describe, it, expect } from "vitest";
import { mockGeneratePrompt } from "../mock";

describe("mockGeneratePrompt", () => {
  it("returns empty string for empty input", () => {
    expect(mockGeneratePrompt("   ")).toBe("");
  });

  it("produces the standard Role/Context/Task/Constraints/Output sections", () => {
    const out = mockGeneratePrompt("write a landing page hero section");
    expect(out).toContain("## Role");
    expect(out).toContain("## Context");
    expect(out).toContain("## Task");
    expect(out).toContain("## Constraints");
    expect(out).toContain("## Output format");
  });

  it("picks the coding domain for a code-shaped idea", () => {
    const out = mockGeneratePrompt("write a function to debounce a search input");
    expect(out).toContain("software engineer");
    expect(out.toLowerCase()).toContain("code block");
  });

  it("picks the writing domain for a copy-shaped idea", () => {
    const out = mockGeneratePrompt("write a marketing email for our new feature launch");
    expect(out).toContain("copywriter");
  });

  it("falls back to a generic domain when nothing matches", () => {
    const out = mockGeneratePrompt("help me plan a weekend trip");
    expect(out).toContain("knowledgeable, careful assistant");
  });

  it("includes the original idea as context", () => {
    const idea = "summarize the attached quarterly report for the exec team";
    const out = mockGeneratePrompt(idea);
    expect(out).toContain(idea);
  });
});
