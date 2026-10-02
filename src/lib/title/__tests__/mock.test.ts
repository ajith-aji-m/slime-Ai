import { describe, it, expect } from "vitest";
import type { Message } from "@/types/chat";
import { mockGenerateTitle } from "../mock";

function userMsg(text: string): Message {
  return {
    id: "m1",
    role: "user",
    parts: [{ type: "text", text }],
    createdAt: "2024-01-01T00:00:00.000Z",
  };
}

function assistantMsg(text: string): Message {
  return {
    id: "m2",
    role: "assistant",
    parts: [{ type: "text", text }],
    createdAt: "2024-01-01T00:00:01.000Z",
  };
}

describe("mockGenerateTitle", () => {
  it("returns a fallback for an empty conversation", () => {
    expect(mockGenerateTitle([])).toBe("New conversation");
  });

  it("picks the leading content words from the user's messages", () => {
    const title = mockGenerateTitle([
      userMsg("banana bread recipe with walnuts and dates"),
    ]);
    expect(title).toBe("Banana bread recipe with walnuts and");
  });

  it("drops a leading filler/stopword before picking words", () => {
    const title = mockGenerateTitle([
      userMsg("can you help me plan a trip to Japan"),
    ]);
    expect(title.toLowerCase().startsWith("can")).toBe(false);
  });

  it("ignores assistant messages — only the user's own words are used", () => {
    const title = mockGenerateTitle([
      userMsg("banana bread recipe"),
      assistantMsg("Here is a detailed guide to an entirely different topic"),
    ]);
    expect(title.toLowerCase()).toContain("banana");
  });

  it("capitalizes the first letter", () => {
    const title = mockGenerateTitle([userMsg("quantum computing basics")]);
    expect(title[0]).toBe(title[0].toUpperCase());
  });
});
