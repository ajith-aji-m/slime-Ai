import { describe, it, expect } from "vitest";
import type { Message } from "@/types/chat";
import { buildTitleRequestMessages, TITLE_SYSTEM_PROMPT } from "../prompt";

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

describe("buildTitleRequestMessages", () => {
  it("prepends the title system prompt", () => {
    const [system] = buildTitleRequestMessages([userMsg("hello")]);
    expect(system.role).toBe("system");
    expect(system.parts[0]).toEqual({ type: "text", text: TITLE_SYSTEM_PROMPT });
  });

  it("builds a labeled user/assistant transcript as the second message", () => {
    const [, transcript] = buildTitleRequestMessages([
      userMsg("what's the capital of France?"),
      assistantMsg("Paris is the capital of France."),
    ]);
    expect(transcript.role).toBe("user");
    const text = transcript.parts[0];
    expect(text.type).toBe("text");
    if (text.type === "text") {
      expect(text.text).toContain("User: what's the capital of France?");
      expect(text.text).toContain("Assistant: Paris is the capital of France.");
    }
  });

  it("skips a system message already in the real conversation", () => {
    const [, transcript] = buildTitleRequestMessages([
      {
        id: "sys",
        role: "system",
        parts: [{ type: "text", text: "internal instruction" }],
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      userMsg("hello there"),
    ]);
    const text = transcript.parts[0];
    if (text.type === "text") {
      expect(text.text).not.toContain("internal instruction");
      expect(text.text).toContain("User: hello there");
    }
  });

  it("falls back to a placeholder for an empty conversation", () => {
    const [, transcript] = buildTitleRequestMessages([]);
    const text = transcript.parts[0];
    if (text.type === "text") {
      expect(text.text).toBe("(empty conversation)");
    }
  });

  it("caps an extremely long transcript", () => {
    const huge = userMsg("x".repeat(10_000));
    const [, transcript] = buildTitleRequestMessages([huge]);
    const text = transcript.parts[0];
    if (text.type === "text") {
      expect(text.text.length).toBeLessThanOrEqual(4000);
    }
  });
});
