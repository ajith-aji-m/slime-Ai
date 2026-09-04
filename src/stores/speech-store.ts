"use client";

import { create } from "zustand";

interface SpeechState {
  /** whether the browser exposes SpeechSynthesis at all */
  supported: boolean;
  /** id of the message currently being read aloud, if any */
  speakingId: string | null;
  /** toggle: starts reading `text` for `id`, or stops if it's already playing */
  speak: (id: string, text: string) => void;
  stop: () => void;
  /** call once on mount to detect browser support */
  detectSupport: () => void;
}

/**
 * Read-aloud for assistant messages, via the browser's built-in
 * SpeechSynthesis API — no server round-trip, no model call, works offline
 * like the rest of local-first Slime AI. There is no NVIDIA text-to-speech
 * NIM wired into the internal router yet (see the model-registry audit in
 * `src/config/models.ts`); if one is added later, `speak`/`stop` here are
 * exactly the surface a server-streamed-audio implementation would slot
 * behind, so the message UI wouldn't need to change.
 *
 * Global (not per-message) state: only one utterance plays at a time
 * app-wide, so every message's play button reflects whichever one — if
 * any — is currently speaking.
 */
export const useSpeechStore = create<SpeechState>((set, get) => ({
  supported: false,
  speakingId: null,

  detectSupport() {
    if (get().supported) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      set({ supported: true });
    }
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
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => {
      if (get().speakingId === id) set({ speakingId: null });
    };
    utterance.onerror = () => {
      if (get().speakingId === id) set({ speakingId: null });
    };
    set({ speakingId: id });
    synth.speak(utterance);
  },
}));
