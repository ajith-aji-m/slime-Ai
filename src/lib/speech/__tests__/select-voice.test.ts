import { describe, it, expect } from "vitest";
import { pickVoice } from "../select-voice";

function voice(
  overrides: Partial<SpeechSynthesisVoice> & { voiceURI: string; lang: string },
): SpeechSynthesisVoice {
  return {
    name: overrides.voiceURI,
    localService: true,
    default: false,
    ...overrides,
  };
}

describe("pickVoice", () => {
  const voices: SpeechSynthesisVoice[] = [
    voice({ voiceURI: "en-basic", lang: "en-US", name: "Standard English" }),
    voice({
      voiceURI: "en-natural",
      lang: "en-US",
      name: "English (Natural)",
      localService: false,
    }),
    voice({ voiceURI: "ta-basic", lang: "ta-IN", name: "Tamil" }),
    voice({ voiceURI: "ta-lk", lang: "ta-LK", name: "Tamil (Sri Lanka)" }),
  ];

  it("returns null when nothing on the device covers the language", () => {
    expect(pickVoice(voices, "fr-FR")).toBeNull();
  });

  it("picks an exact language match", () => {
    const picked = pickVoice(voices, "ta-IN");
    expect(picked?.voiceURI).toBe("ta-basic");
  });

  it("prefers a higher-quality-hinted / network voice over a plain local one", () => {
    const picked = pickVoice(voices, "en-US");
    expect(picked?.voiceURI).toBe("en-natural");
  });

  it("falls back to a same-primary-subtag match when there's no exact one", () => {
    // Asking for ta-IN with only ta-LK installed still works — same language.
    const onlyLk = voices.filter((v) => v.voiceURI !== "ta-basic");
    const picked = pickVoice(onlyLk, "ta-IN");
    expect(picked?.voiceURI).toBe("ta-lk");
  });

  it("honors an explicit preferredURI when its language still matches", () => {
    const picked = pickVoice(voices, "ta-IN", "ta-lk");
    expect(picked?.voiceURI).toBe("ta-lk");
  });

  it("ignores a preferredURI whose language doesn't match what's being spoken", () => {
    // Preferred voice is English, but the text is Tamil — don't force-feed it.
    const picked = pickVoice(voices, "ta-IN", "en-natural");
    expect(picked?.voiceURI).toBe("ta-basic");
  });
});
