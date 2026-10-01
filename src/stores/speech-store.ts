"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { detectSpeechLang } from "@/lib/speech/detect-lang";
import { pickVoice } from "@/lib/speech/select-voice";
import {
  DEFAULT_PIPER_VOICE_ID,
  piperVoiceLang,
  synthesizePiper,
} from "@/lib/speech/piper";

type SpeechEngine = "browser" | "piper";

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

  /**
   * "browser" (default, free, instant, the OS's own `SpeechSynthesis`
   * voices) or "piper" (opt-in, genuinely more natural open-source neural
   * voices via WebAssembly — see `src/lib/speech/piper.ts`). Piper only
   * actually speaks an utterance when the configured `piperVoiceId`'s own
   * language matches the text's detected language — Piper's published
   * voice set has no Tamil/Hindi/most-Indic-languages coverage at all, so
   * anything outside what the chosen Piper voice covers still falls back
   * to "browser", exactly as if this were set to "browser" in the first
   * place. See `speak()`.
   */
  engine: SpeechEngine;
  piperVoiceId: string;
  /** 0–1 while a Piper voice model is downloading (first use of a voice
   * only — cached after), null the rest of the time. */
  piperDownloadProgress: number | null;

  /** toggle: starts reading `text` for `id`, or stops if it's already playing */
  speak: (id: string, text: string) => void;
  /** Settings page "Preview" button for the browser engine — speaks a fixed
   * sample with a specific voice directly, bypassing language
   * auto-detection (the user already told us which voice they want to
   * hear). */
  previewVoice: (voiceURI: string, lang: string) => void;
  /** Same, for a specific Piper voice id. */
  previewPiperVoice: (voiceId: string) => void;
  stop: () => void;
  /** call once on mount to detect browser support */
  detectSupport: () => void;
  refreshVoices: () => void;
  setPreferredVoice: (voiceURI: string | null) => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setEngine: (engine: SpeechEngine) => void;
  setPiperVoiceId: (voiceId: string) => void;
}

/** Module-level, not store state, same reasoning as `dictation-store.ts`'s
 * `activeRecognition`: whether the `voiceschanged` listener is already wired
 * up isn't itself UI state. Guards against double-registering across
 * multiple `detectSupport()` calls (every message row calls it on mount). */
let voicesListenerAttached = false;

/** The one `<audio>` element Piper playback uses — module-level for the
 * same reason `activeRecognition`/the listener flag above are: not
 * meaningfully UI state, and there's only ever one at a time app-wide. */
let piperAudio: HTMLAudioElement | null = null;

function stopPiperAudio() {
  if (piperAudio) {
    piperAudio.pause();
    piperAudio.src = "";
    piperAudio = null;
  }
}

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
 * Read-aloud for assistant messages. Two engines:
 *
 * - **Browser** (default) — the OS's own built-in `SpeechSynthesis` voices.
 *   No server round-trip, no model call, works offline like the rest of
 *   local-first Slime AI. An utterance with no `lang`/`voice` set falls
 *   back to the browser's default (usually an English) voice regardless of
 *   the text's actual script — for non-Latin text (Tamil and others) that
 *   either mispronounces badly or produces no audio at all. `speak()`
 *   detects the dominant script (`detectSpeechLang`) and picks a matching
 *   installed voice (`pickVoice`) instead.
 * - **Piper** (opt-in) — a real open-source neural TTS engine running in
 *   the browser via WebAssembly (`src/lib/speech/piper.ts`), noticeably
 *   smoother than most OS default voices, still free and still no server
 *   call — just a larger one-time download per voice (cached after). Only
 *   covers the languages Piper's community has published voice models for
 *   (no Tamil/Hindi/most Indic languages) — `speak()` only routes to it
 *   when the chosen Piper voice's language actually matches the text,
 *   falling back to the browser engine otherwise so non-covered languages
 *   keep working exactly as before Piper existed.
 *
 * Neither is a routed-model capability — no NVIDIA/Groq call either way.
 * True *expressive* (emotionally-inflected) speech isn't something either
 * engine can do — only which voice is used and `rate`/`pitch` are in reach
 * here; genuinely expressive speech needs a real paid neural TTS API,
 * which this intentionally still is not.
 *
 * Global (not per-message) state: only one utterance plays at a time
 * app-wide (regardless of engine), so every message's play button reflects
 * whichever one — if any — is currently speaking.
 */
export const useSpeechStore = create<SpeechState>()(
  persist(
    (set, get) => {
      /** Shared by `speak()`'s Piper branch and `previewPiperVoice()` —
       * synthesizes with Piper and plays the result, tracking download
       * progress and bailing out cleanly if the user cancelled (clicked
       * stop, or started a different message) while synthesis was still
       * in flight. */
      async function playWithPiper(
        playbackId: string,
        text: string,
        voiceId: string,
      ) {
        try {
          set({ piperDownloadProgress: 0 });
          const blob = await synthesizePiper(text, voiceId, (fraction) => {
            if (get().speakingId === playbackId) {
              set({ piperDownloadProgress: fraction });
            }
          });
          set({ piperDownloadProgress: null });
          if (get().speakingId !== playbackId) return; // cancelled mid-flight

          const audio = new Audio(URL.createObjectURL(blob));
          piperAudio = audio;
          audio.onended = () => {
            if (get().speakingId === playbackId) set({ speakingId: null });
          };
          audio.onerror = () => {
            if (get().speakingId === playbackId) {
              set({ speakingId: null, error: "Couldn't play this voice." });
            }
          };
          await audio.play();
        } catch {
          if (get().speakingId === playbackId) {
            set({
              speakingId: null,
              piperDownloadProgress: null,
              error:
                "Couldn't generate speech with the Piper voice — check your connection, or switch to the browser voice in Settings.",
            });
          }
        }
      }

      function speakWithBrowser(id: string, text: string, lang: string) {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
          return;
        }
        const { voices, preferredVoiceURI, rate, pitch } = get();
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
      }

      return {
        supported: false,
        speakingId: null,
        voices: [],
        preferredVoiceURI: null,
        rate: 1,
        pitch: 1,
        error: null,
        engine: "browser",
        piperVoiceId: DEFAULT_PIPER_VOICE_ID,
        piperDownloadProgress: null,

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
        setEngine(engine) {
          set({ engine, error: null });
        },
        setPiperVoiceId(voiceId) {
          set({ piperVoiceId: voiceId });
        },

        stop() {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          stopPiperAudio();
          set({ speakingId: null, piperDownloadProgress: null });
        },

        speak(id, text) {
          if (typeof window === "undefined") return;
          if (get().speakingId === id) {
            get().stop();
            return;
          }
          get().stop();

          const lang = detectSpeechLang(text);
          const { engine, piperVoiceId } = get();
          const primary = lang.split("-")[0]?.toLowerCase();
          const usePiper =
            engine === "piper" && piperVoiceLang(piperVoiceId) === primary;

          if (usePiper) {
            set({ speakingId: id, error: null });
            void playWithPiper(id, text, piperVoiceId);
            return;
          }

          speakWithBrowser(id, text, lang);
        },

        previewVoice(voiceURI, lang) {
          if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            return;
          }
          get().stop();

          const voice = get().voices.find((v) => v.voiceURI === voiceURI) ?? null;
          const utterance = new SpeechSynthesisUtterance(
            "Hello! This is how I'll sound when reading your messages aloud.",
          );
          utterance.lang = lang;
          utterance.rate = get().rate;
          utterance.pitch = get().pitch;
          if (voice) utterance.voice = voice;

          const previewId = `preview:${voiceURI}`;
          set({ speakingId: previewId, error: null });
          speakUtterance(
            utterance,
            () => {
              if (get().speakingId === previewId) set({ speakingId: null });
            },
            () => {
              if (get().speakingId === previewId) {
                set({ speakingId: null, error: "Couldn't preview this voice." });
              }
            },
          );
        },

        previewPiperVoice(voiceId) {
          get().stop();
          const previewId = `piper-preview:${voiceId}`;
          set({ speakingId: previewId, error: null });
          void playWithPiper(
            previewId,
            "Hello! This is how I'll sound when reading your messages aloud.",
            voiceId,
          );
        },
      };
    },
    {
      name: "slime-speech",
      partialize: (s) => ({
        preferredVoiceURI: s.preferredVoiceURI,
        rate: s.rate,
        pitch: s.pitch,
        engine: s.engine,
        piperVoiceId: s.piperVoiceId,
      }),
    },
  ),
);
