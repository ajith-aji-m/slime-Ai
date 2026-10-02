import { describe, it, expect } from "vitest";
import { cleanGeneratedTitle } from "../clean";

describe("cleanGeneratedTitle", () => {
  it("strips wrapping double quotes", () => {
    expect(cleanGeneratedTitle('"Banana bread recipe"')).toBe(
      "Banana bread recipe",
    );
  });

  it("strips wrapping single and curly quotes", () => {
    expect(cleanGeneratedTitle("'Banana bread recipe'")).toBe(
      "Banana bread recipe",
    );
    expect(cleanGeneratedTitle("“Banana bread recipe”")).toBe(
      "Banana bread recipe",
    );
  });

  it("strips a leading Title: prefix", () => {
    expect(cleanGeneratedTitle("Title: Banana bread recipe")).toBe(
      "Banana bread recipe",
    );
  });

  it("strips Markdown emphasis markers", () => {
    expect(cleanGeneratedTitle("**Banana bread recipe**")).toBe(
      "Banana bread recipe",
    );
  });

  it("strips trailing punctuation", () => {
    expect(cleanGeneratedTitle("Banana bread recipe.")).toBe(
      "Banana bread recipe",
    );
  });

  it("takes only the first non-empty line", () => {
    expect(
      cleanGeneratedTitle("\nBanana bread recipe\nSome extra commentary"),
    ).toBe("Banana bread recipe");
  });

  it("collapses internal whitespace within the first line", () => {
    expect(cleanGeneratedTitle("Banana   bread recipe\nSome commentary")).toBe(
      "Banana bread recipe",
    );
  });

  it("truncates an overly long reply with an ellipsis", () => {
    const long = "A".repeat(100);
    const out = cleanGeneratedTitle(long);
    expect(out.length).toBeLessThanOrEqual(60);
    expect(out.endsWith("…")).toBe(true);
  });

  it("returns an empty string for empty input", () => {
    expect(cleanGeneratedTitle("")).toBe("");
    expect(cleanGeneratedTitle("   \n  ")).toBe("");
  });
});
