"use client";

import { create } from "zustand";

export type AiMode = "mock" | "nvidia";

interface AiStatusState {
  /** "mock" until proven otherwise — safe offline default */
  mode: AiMode;
  /** whether the backend can actually generate images (never faked) */
  imageGeneration: boolean;
  ready: boolean;
  refresh: () => Promise<void>;
}

/**
 * Minimal client view of the AI backend: is a real routed provider available,
 * or should we use the offline mock? No model or provider names ever cross here.
 */
export const useAiStatusStore = create<AiStatusState>((set) => ({
  mode: "mock",
  imageGeneration: false,
  ready: false,

  async refresh() {
    try {
      const res = await fetch("/api/ai/status", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as {
        mode: AiMode;
        imageGeneration?: boolean;
      };
      set({
        mode: data.mode === "nvidia" ? "nvidia" : "mock",
        imageGeneration: data.imageGeneration === true,
        ready: true,
      });
    } catch {
      set({ mode: "mock", imageGeneration: false, ready: true });
    }
  },
}));

export const aiMode = () => useAiStatusStore.getState().mode;
