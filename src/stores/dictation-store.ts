"use client";

import { create } from "zustand";

interface DictationState {
  /** whether the browser exposes SpeechRecognition at all (Chromium/Safari
   * only — not Firefox; see `src/types/speech-recognition.d.ts`) */
  supported: boolean;
  /** true while actively listening for speech */
  listening: boolean;
  /** last recognition failure, surfaced once and cleared on the next start */
  error: string | null;
  /** call once on mount to detect browser support */
  detectSupport: () => void;
  /**
   * Starts listening. `onChunk` fires for every recognized chunk — `final`
   * is true once that chunk won't change further (the composer appends
   * final chunks and ignores interim ones, which exist only to show the
   * user words are being heard).
   */
  start: (onChunk: (text: string, final: boolean) => void) => void;
  stop: () => void;
}

function getRecognitionCtor(): typeof SpeechRecognition | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

// Module-level, not store state: the live recognizer instance itself isn't
// serializable/comparable state a component should react to re-rendering on
// — only `listening`/`error` are. Matches `speech-store.ts`'s precedent of
// a single global session (one mic input at a time, app-wide).
let activeRecognition: SpeechRecognition | null = null;

/**
 * Voice-to-text composer input, via the browser's built-in SpeechRecognition
 * API — no server round-trip, no model call, works offline like the rest of
 * local-first Slime AI (same spirit as `speech-store.ts`'s read-aloud). Browser
 * support is narrower than SpeechSynthesis (no Firefox, requires a secure
 * context and a microphone permission grant), so every caller must check
 * `supported` and hide the mic button entirely rather than show it disabled —
 * same pattern `MessageActions` already uses for the read-aloud button.
 */
export const useDictationStore = create<DictationState>((set, get) => ({
  supported: false,
  listening: false,
  error: null,

  detectSupport() {
    if (get().supported) return;
    if (getRecognitionCtor()) set({ supported: true });
  },

  start(onChunk) {
    const Ctor = getRecognitionCtor();
    if (!Ctor || get().listening) return;

    activeRecognition?.abort();

    const recognition = new Ctor();
    recognition.lang =
      typeof navigator !== "undefined" ? navigator.language || "en-US" : "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? "";
        if (result.isFinal) finalText += transcript;
        else interimText += transcript;
      }
      if (finalText) onChunk(finalText, true);
      if (interimText) onChunk(interimText, false);
    };

    recognition.onerror = (event) => {
      // "no-speech"/"aborted" fire on ordinary silence-timeout or an
      // intentional stop() — not real failures worth surfacing.
      const benign = event.error === "no-speech" || event.error === "aborted";
      set({
        listening: false,
        error: benign
          ? null
          : event.error === "not-allowed" || event.error === "service-not-allowed"
            ? "Microphone access was denied."
            : "Voice input failed. Try again.",
      });
      activeRecognition = null;
    };

    recognition.onend = () => {
      // Some browsers end the session on their own after a silence timeout
      // even in continuous mode — reflect that rather than leaving the mic
      // button showing "listening" forever.
      set({ listening: false });
      activeRecognition = null;
    };

    activeRecognition = recognition;
    set({ listening: true, error: null });
    recognition.start();
  },

  stop() {
    activeRecognition?.stop();
  },
}));
