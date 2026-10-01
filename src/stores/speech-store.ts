"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectSpeechLang } from "@/lib/speech/detect-lang";
import { pickVoice } from "@/lib/speech/select-voice";

interface SpeechState {
  /** whether the browser exposes SpeechSynthesis at all */
  supported: boolean;
  /** id of the message currently being read aloud, if any */
  speakingId: string | null;
  /** installed voices, refreshed on `voiceschanged` — empty until then on
   * browsers (Chrome notably) that load them asynchronously */
  voices: SpeechSynthesisVoice[];
  /** the user's explicit pick from Settings, or null for "auto-match the
   * text's detected language" (the default) */
  preferredVoiceURI: string | null;
  /** 0.1–10 per the spec; kept to a sane 0.75–1.25 UI range */
  rate: number;
  /** 0–2 per the spec */
  pitch: number;
  /** last speak failure — surfaced so "nothing happened" isn't silent;
   * cleared on the next successful `speak()` */
  error: string | null;

  /** toggle: starts reading `text` for `id`, or stops if it's already playing */
  speak: (id: string, text: string) => void;
  /** Settings page "Preview" button — speaks a fixed sample with a specific
   * voice directly, bypassing language auto-detection (the user already
   * told us which voice they want to hear). */
  previewVoice: (voiceURI: string, lang: string) => void;
  stop: () => void;
  /** call once on mount to detect browser support */
  detectSupport: () => void;
  refreshVoices: () => void;
  setPreferredVoice: (voiceURI: string | null) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
}

/** Module-level, not store state, same reasoning as `dictation-store.ts`'s
 * `activeRecognition`: whether the `voiceschanged` listener is already wired
 * up isn't itself UI state. Guards against double-registering across
 * multiple `detectSupport()` calls (every message row calls it on mount). */
let voicesListenerAttached = false;

function speakUtterance(
  utterance: SpeechSynthesisUtterance,
  onEnd: () => void,
  onError: () => void,
) {
  const synth = window.speechSynthesis;
  utterance.onend = onEnd;
  utterance.onerror = onError;
  synth.speak(utterance);
}

/**
 * Read-aloud for assistant messages, via the browser's built-in
 * SpeechSynthesis API — no server round-trip, no model call, works offline
 * like the rest of local-first Slime AI. There is no NVIDIA/Groq
 * text-to-speech model wired into the internal router yet (see the
 * model-registry audit in `src/config/models.ts`); if one is added later,
 * `speak`/`stop` here are exactly the surface a server-streamed-audio
 * implementation would slot behind, so the message UI wouldn't need to
 * change.
 *
 * Global (not per-message) state: only one utterance plays at a time
 * app-wide, so every message's play button reflects whichever one — if
 * any — is currently speaking.
 *
 * Voice/language handling: an utterance with no `lang`/`voice` set falls
 * back to the browser's default (usually an English voice) regardless of
 * the text's actual script — for non-Latin text (Tamil and others) that
 * either mispronounces badly or, on some engines, produces no audio at all
 * for characters it can't map to phonemes. `speak()` detects the
 * dominant script (`detectSpeechLang`) and picks a matching installed voice
 * (`pickVoice`) instead. True *expressive* (emotionally-inflected) speech
 * isn't something the Web Speech API can do at all, regardless of voice
 * choice — only `rate`/`pitch` and which installed voice is used are in
 * reach here; a genuinely more natural/expressive voice needs a real neural
 * TTS backend, which this intentionally is not (see the paragraph above).
 */
export const useSpeechStore = create<SpeechState>()(
  persist(
    (set, get) => ({
      supported: false,
      speakingId: null,
      voices: [],
      preferredVoiceURI: null,
      rate: 1,
      pitch: 1,
      error: null,

      detectSupport() {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          return;
        }
        if (!get().supported) set({ supported: true });

        if (!voicesListenerAttached) {
          voicesListenerAttached = true;
          window.speechSynthesis.addEventListener("voiceschanged", () => {
            useSpeechStore.getState().refreshVoices();
          });
        }
        if (get().voices.length === 0) get().refreshVoices();
      },

      refreshVoices() {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          return;
        }
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) set({ voices });
      },

      setPreferredVoice(voiceURI) {
        set({ preferredVoiceURI: voiceURI });
      },
      setRate(rate) {
        set({ rate: Math.min(2, Math.max(0.5, rate)) });
      },
      setPitch(pitch) {
        set({ pitch: Math.min(2, Math.max(0, pitch)) });
      },

      stop() {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        window.speechSynthesis.cancel();
        set({ speakingId: null });
      },

      speak(id, text) {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        const synth = window.speechSynthesis;

        if (get().speakingId === id) {
          synth.cancel();
          set({ speakingId: null });
          return;
        }

        synth.cancel();
        const { voices, preferredVoiceURI, rate, pitch } = get();
        const lang = detectSpeechLang(text);
        const voice = pickVoice(voices, lang, preferredVoiceURI);

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.pitch = pitch;
        if (voice) utterance.voice = voice;

        set({
          speakingId: id,
          // Still attempts to speak with whatever default voice the engine
          // falls back to — some overlap/mispronunciation is better than
          // silence — but says plainly when no installed voice actually
          // covers this language, since no code here can make one exist.
          error:
            voice || lang === "en-US"
              ? null
              : `No installed voice covers this language (detected ${lang}) — using the default voice instead. Add one in your device's text-to-speech settings for accurate pronunciation.`,
        });

        speakUtterance(
          utterance,
          () => {
            if (get().speakingId === id) set({ speakingId: null });
          },
          () => {
            if (get().speakingId !== id) return;
            set({
              speakingId: null,
              error: "Couldn't read this message aloud — try again.",
            });
          },
        );
      },

      previewVoice(voiceURI, lang) {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
        const synth = window.speechSynthesis;
        synth.cancel();
        set({ speakingId: null });

        const voice = get().voices.find((v) => v.voiceURI === voiceURI) ?? null;
        const utterance = new SpeechSynthesisUtterance(
          "Hello! This is how I'll sound when reading your messages aloud.",
        );
        utterance.lang = lang;
        utterance.rate = get().rate;
        utterance.pitch = get().pitch;
        if (voice) utterance.voice = voice;

        set({ speakingId: `preview:${voiceURI}` });
        speakUtterance(
          utterance,
          () => {
            if (get().speakingId === `preview:${voiceURI}`) set({ speakingId: null });
          },
          () => {
            if (get().speakingId === `preview:${voiceURI}`) {
              set({ speakingId: null, error: "Couldn't preview this voice." });
            }
          },
        );
      },
    }),
    {
      name: "slime-speech",
      partialize: (s) => ({
        preferredVoiceURI: s.preferredVoiceURI,
        rate: s.rate,
        pitch: s.pitch,
      }),
    },
  ),
);
