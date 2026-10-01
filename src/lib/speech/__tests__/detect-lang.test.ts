import { describe, it, expect } from "vitest";
import { detectSpeechLang } from "../detect-lang";

describe("detectSpeechLang", () => {
  it("detects Tamil script", () => {
    expect(detectSpeechLang("வணக்கம், எப்படி இருக்கிறீர்கள்?")).toBe("ta-IN");
  });

  it("detects Hindi (Devanagari) script", () => {
    expect(detectSpeechLang("नमस्ते, आप कैसे हैं?")).toBe("hi-IN");
  });

  it("falls back to the default for plain Latin-script text", () => {
    expect(detectSpeechLang("Hello, how are you?")).toBe("en-US");
  });

  it("falls back to a custom default when given one", () => {
    expect(detectSpeechLang("Hello", "fr-FR")).toBe("fr-FR");
  });

  it("picks the dominant script in mixed text", () => {
    // Mostly Tamil with one English word embedded — should still read as Tamil.
    const mostlyTamil = "இது ஒரு Slime AI சோதனை செய்தியாகும், இது நீளமானது.";
    expect(detectSpeechLang(mostlyTamil)).toBe("ta-IN");
  });

  it("treats empty text as the default", () => {
    expect(detectSpeechLang("")).toBe("en-US");
  });
});
