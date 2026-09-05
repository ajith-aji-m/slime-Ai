"use client";

import { create } from "zustand";

/**
 * The mascot's current "action" — an NPC-style state machine driving which
 * `SlimeMark` animation/expression plays. `typing`/`sent`/`celebrate`/`error`
 * are all transient reactions to real app events (composer input, a message
 * going out, a reply landing, a stream failing); `sleeping` is what it falls
 * back to on its own after a stretch of no activity. `idle` is the resting
 * state in between.
 */
export type SlimeAction =
  | "idle"
  | "typing"
  | "sent"
  | "celebrate"
  | "error"
  | "sleeping";

interface MascotState {
  action: SlimeAction;
  setTyping: (typing: boolean) => void;
  /** the user just sent a message — a quick perk-up */
  notifySent: () => void;
  /** an assistant reply finished successfully — a happy beat */
  notifyReceived: () => void;
  /** a stream/provider failure — a brief sad/droop reaction */
  notifyError: () => void;
}

/** doze off after this long with nothing happening */
const IDLE_TIMEOUT_MS = 60_000;
const SENT_DURATION_MS = 900;
const CELEBRATE_DURATION_MS = 1600;
const ERROR_DURATION_MS = 2000;

// Kept outside React state, same pattern as `conversation-store`'s abort
// controllers — timers aren't state themselves, just plumbing for it.
let idleTimer: ReturnType<typeof setTimeout> | null = null;
let transientTimer: ReturnType<typeof setTimeout> | null = null;

export const useMascotStore = create<MascotState>((set, get) => {
  function armIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      // only doze off if nothing else is already claiming the mascot
      if (get().action === "idle") set({ action: "sleeping" });
    }, IDLE_TIMEOUT_MS);
  }

  /** any real activity cancels a nap-in-progress and resets the clock */
  function noteActivity() {
    if (get().action === "sleeping") set({ action: "idle" });
    armIdleTimer();
  }

  function playTransient(action: SlimeAction, durationMs: number) {
    noteActivity();
    if (transientTimer) clearTimeout(transientTimer);
    set({ action });
    transientTimer = setTimeout(() => {
      transientTimer = null;
      set((s) => (s.action === action ? { action: "idle" } : s));
    }, durationMs);
  }

  armIdleTimer();

  return {
    action: "idle",

    setTyping(typing) {
      // typing has no fixed duration — it tracks the composer directly, and
      // yields to whichever transient (sent/celebrate/error) is mid-flight.
      if (transientTimer) return;
      noteActivity();
      set({ action: typing ? "typing" : "idle" });
    },

    notifySent() {
      playTransient("sent", SENT_DURATION_MS);
    },
    notifyReceived() {
      playTransient("celebrate", CELEBRATE_DURATION_MS);
    },
    notifyError() {
      playTransient("error", ERROR_DURATION_MS);
    },
  };
});
