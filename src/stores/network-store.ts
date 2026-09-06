"use client";

import { create } from "zustand";

interface NetworkState {
  online: boolean;
  /** attach the browser online/offline listeners — idempotent, call once */
  init: () => void;
}

let initialized = false;

/**
 * Browser connectivity, for the composer/top bar to warn on and for the
 * mascot to react to. `navigator.onLine` only reflects the network
 * interface being up (not that the internet or our own server is actually
 * reachable), but it's a cheap, real signal for the one thing that matters
 * here: don't let the user submit a message that can't possibly go out.
 */
export const useNetworkStore = create<NetworkState>((set) => ({
  online: typeof navigator === "undefined" ? true : navigator.onLine,

  init() {
    if (initialized || typeof window === "undefined") return;
    initialized = true;
    window.addEventListener("online", () => set({ online: true }));
    window.addEventListener("offline", () => set({ online: false }));
  },
}));
