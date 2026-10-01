import { describe, it, expect } from "vitest";
import { PIPER_LANGUAGE_CODES, piperVoiceLang, DEFAULT_PIPER_VOICE_ID } from "../piper";

describe("piperVoiceLang", () => {
  it("reads the primary language subtag out of a Piper voice id", () => {
    expect(piperVoiceLang("en_US-hfc_female-medium")).toBe("en");
    expect(piperVoiceLang("de_DE-thorsten-high")).toBe("de");
    expect(piperVoiceLang("zh_CN-huayan-medium")).toBe("zh");
  });

  it("matches the language of the built-in default voice", () => {
    expect(piperVoiceLang(DEFAULT_PIPER_VOICE_ID)).toBe("en");
  });
});

describe("PIPER_LANGUAGE_CODES", () => {
  it("does not claim coverage for Tamil, Hindi or other Indic languages Piper has no voices for", () => {
    // The whole reason speech-store.ts checks this set before routing to
    // Piper: silently claiming a language Piper can't actually speak would
    // regress the exact Tamil "shows but doesn't speak" bug this was built
    // to fix in the first place.
    for (const code of ["ta", "hi", "te", "kn", "ml", "bn", "gu", "pa", "ja", "ko"]) {
      expect(PIPER_LANGUAGE_CODES.has(code)).toBe(false);
    }
  });

  it("does cover English and a reasonable set of major European languages", () => {
    for (const code of ["en", "de", "fr", "es", "it", "pt", "ru", "nl", "pl"]) {
      expect(PIPER_LANGUAGE_CODES.has(code)).toBe(true);
    }
  });
});
