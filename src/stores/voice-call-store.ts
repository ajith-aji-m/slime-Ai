"use client";

import { create } from "zustand";

interface VoiceCallState {
  open: boolean;
  /** conversation this call is bound to — null until the first turn creates
   * one (starting a call from the welcome screen, before any conversation
   * exists yet). Kept in global state, not component state, so the call
   * survives the client-side navigation from `/chat` to `/chat/[id]` that
   * creating that first conversation triggers. */
  conversationId: string | null;
  start: (conversationId: string | null) => void;
  bindConversation: (id: string) => void;
  close: () => void;
}

/**
 * Open/closed + which conversation a hands-free voice call
 * (`VoiceCallOverlay`) is bound to. Deliberately thin — the actual listen /
 * send / speak orchestration lives in the overlay component itself, which
 * reads this just to know whether to run and against which conversation.
 */
export const useVoiceCallStore = create<VoiceCallState>((set) => ({
  open: false,
  conversationId: null,
  start: (conversationId) => set({ open: true, conversationId }),
  bindConversation: (id) => set({ conversationId: id }),
  close: () => set({ open: false, conversationId: null }),
}));
