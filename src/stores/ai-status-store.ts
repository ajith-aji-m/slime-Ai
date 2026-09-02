"use client";

import { create } from "zustand";

export type AiMode = "mock" | "nvidia";

interface AiStatusState {
  /** "mock" until proven otherwise — safe offline default */
  mode: AiMode;
  ready: boolean;
  refresh: () => Promise<void>;
}

/**
 * Minimal client view of the AI backend: is a real routed provider available,
 * or should we use the offline mock? No model or provider names ever cross here.
 */
export const useAiStatusStore = create<AiStatusState>((set) => ({
  mode: "mock",
  ready: false,

  async refresh() {
    try {
      const res = await fetch("/api/ai/status", { cache: "no-store" });
      if (!res.ok) throw new Error(String(res.status));
      const data = (await res.json()) as { mode: AiMode };
      set({ mode: data.mode === "nvidia" ? "nvidia" : "mock", ready: true });
    } catch {
      set({ mode: "mock", ready: true });
    }
  },
}));

export const aiMode = () => useAiStatusStore.getState().mode;
