import { describe, it, expect } from "vitest";
import { toSpeechText } from "../to-speech-text";
import type { Message, MessagePart } from "@/types/chat";

function msg(parts: MessagePart[]): Message {
  return { id: "m1", role: "assistant", parts, createdAt: "2026-01-01T00:00:00Z" };
}

function text(t: string): Message {
  return msg([{ type: "text", text: t }]);
}

describe("toSpeechText", () => {
  it("leaves plain prose untouched", () => {
    expect(toSpeechText(text("Here is a normal sentence."))).toBe(
      "Here is a normal sentence.",
    );
  });

  it("strips bold/italic/strikethrough markers, keeping the text", () => {
    expect(toSpeechText(text("This is **bold** and *italic* and ~~gone~~."))).toBe(
      "This is bold and italic and gone.",
    );
    expect(toSpeechText(text("__bold__ and _italic_ too."))).toBe(
      "bold and italic too.",
    );
    expect(toSpeechText(text("***both at once***"))).toBe("both at once");
  });

  it("strips heading markers, keeping the heading text", () => {
    expect(toSpeechText(text("# Big Heading\nSome text."))).toBe(
      "Big Heading\nSome text.",
    );
    expect(toSpeechText(text("### Smaller"))).toBe("Smaller");
  });

  it("strips bullet and numbered list markers, keeping the item text", () => {
    expect(toSpeechText(text("- first\n- second\n* third"))).toBe(
      "first\nsecond\nthird",
    );
    expect(toSpeechText(text("1. one\n2. two"))).toBe("one\ntwo");
  });

  it("reads link text and drops the URL", () => {
    expect(
      toSpeechText(text("Check [our docs](https://example.com/docs) for more.")),
    ).toBe("Check our docs for more.");
  });

  it("reads image alt text (or says 'Image.') and drops the URL", () => {
    expect(toSpeechText(text("![a sunset](https://example.com/x.png)"))).toBe(
      "a sunset",
    );
    expect(toSpeechText(text("![](https://example.com/x.png)"))).toBe("Image.");
  });

  it("keeps inline code text, drops the backticks", () => {
    expect(toSpeechText(text("Run `npm install` first."))).toBe(
      "Run npm install first.",
    );
  });

  it("announces a fenced code block instead of reading the source", () => {
    const withCode = text("Here:\n```js\nconst x = 1;\n```\nDone.");
    const out = toSpeechText(withCode);
    expect(out).not.toContain("const x");
    expect(out).toContain("Code block.");
  });

  it("strips blockquote markers and horizontal rules", () => {
    expect(toSpeechText(text("> a quote"))).toBe("a quote");
    expect(toSpeechText(text("before\n---\nafter"))).toBe("before\nafter");
  });

  it("reads a Markdown table's cells, comma-separated, dropping pipes and the separator row", () => {
    const out = toSpeechText(text("| Name | Age |\n|---|---|\n| Alice | 30 |"));
    expect(out).toBe("Name, Age\nAlice, 30");
  });

  it("strips raw HTML tags", () => {
    expect(toSpeechText(text("Hello <b>world</b>!"))).toBe("Hello world!");
  });

  it("handles a structured code part by announcing it, not reading the source", () => {
    const out = toSpeechText(
      msg([{ type: "code", language: "js", code: "const x = 1;\nconsole.log(x);" }]),
    );
    expect(out).not.toContain("console.log");
    expect(out).toContain("Code block.");
  });

  it("reads a structured table part's cells the same way as inline table markdown", () => {
    const out = toSpeechText(
      msg([{ type: "table", markdown: "| A | B |\n|---|---|\n| 1 | 2 |" }]),
    );
    expect(out).toBe("A, B\n1, 2");
  });

  it("drops tool_call parts entirely (internal bookkeeping, not for listeners)", () => {
    const out = toSpeechText(
      msg([
        { type: "tool_call", tool: "web_search", label: "Searching the web", status: "done" },
        { type: "text", text: "Here is what I found." },
      ]),
    );
    expect(out).toBe("Here is what I found.");
  });

  it("summarizes citations by count instead of reading each URL/title", () => {
    const out = toSpeechText(
      msg([
        {
          type: "citation_group",
          citations: [
            { id: "1", label: "Example", href: "https://example.com" },
            { id: "2", label: "Other", href: "https://other.com" },
          ],
        },
      ]),
    );
    expect(out).toContain("2 sources cited.");
  });

  it("combines multiple parts with a blank line between them", () => {
    const out = toSpeechText(
      msg([
        { type: "text", text: "**Intro**" },
        { type: "code", language: "js", code: "x()" },
        { type: "text", text: "Done." },
      ]),
    );
    expect(out).toBe("Intro\n\nCode block.\n\nDone.");
  });
});
