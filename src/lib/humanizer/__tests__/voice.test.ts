import { describe, it, expect } from "vitest";
import { checkFirstPersonPlural } from "../voice";
import { mockHumanize } from "../mock";

describe("checkFirstPersonPlural", () => {
  it("finds no first-person-plural pronouns in clean text", () => {
    const result = checkFirstPersonPlural("The team shipped the release on time.");
    expect(result.count).toBe(0);
    expect(result.found).toEqual([]);
  });

  it("finds and counts we/our/us occurrences", () => {
    const result = checkFirstPersonPlural(
      "We think our approach works. It helps us move faster.",
    );
    expect(result.count).toBe(3);
    expect(result.found).toEqual(expect.arrayContaining(["we", "our", "us"]));
  });

  it("ignores pronouns inside fenced code blocks", () => {
    const result = checkFirstPersonPlural("```js\n// we track our state here\n```");
    expect(result.count).toBe(0);
  });
});

describe("mockHumanize pronoun rewriting", () => {
  it("drops common we-voice lead-ins", () => {
    const out = mockHumanize("We believe our team is excited to ship this.");
    expect(out.toLowerCase()).not.toContain("we believe");
    expect(out.toLowerCase()).toContain("the team");
  });

  it("rewrites 'we are excited to' into a direct lead-in", () => {
    const out = mockHumanize("We are excited to announce the update.");
    expect(out.toLowerCase()).toContain("excited to announce");
    expect(out.toLowerCase()).not.toMatch(/\bwe are\b/);
  });
});
