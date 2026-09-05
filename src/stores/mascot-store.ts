"use client";

import { create } from "zustand";

/**
 * Ephemeral (never persisted) mascot expression state. Today just tracks
 * whether the user is actively typing in the composer, so the hero
 * `SlimeMark` can glance down in concentration instead of sitting static —
 * a hook for future expressions (e.g. an "idea" look on tool-select) without
 * threading props through the composer/hero tree.
 */
interface MascotState {
  typing: boolean;
  setTyping: (typing: boolean) => void;
}

export const useMascotStore = create<MascotState>((set) => ({
  typing: false,
  setTyping: (typing) => set({ typing }),
}));
