"use client";

import { create } from "zustand";
import type { CanvasArtifact } from "@/types/canvas";

interface CanvasState {
  /** desktop: panel expanded · mobile: full-screen workspace shown */
  open: boolean;
  activeId: string | null;
  /** which source/preview sub-view the active artifact shows (html/code) */
  view: "preview" | "source";
  artifacts: Record<string, CanvasArtifact>;
  order: string[];
  /** assistant messages we've already auto-opened Canvas for (once each) */
  autoOpened: Set<string>;

  registerArtifacts: (list: CanvasArtifact[]) => void;
  openArtifact: (id: string) => void;
  setView: (view: "preview" | "source") => void;
  toggleCanvas: () => void;
  close: () => void;
  noteAutoOpened: (messageId: string) => void;
  /** clear the panel when leaving a conversation (artifacts are kept) */
  collapseForRoute: () => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  open: false,
  activeId: null,
  view: "preview",
  artifacts: {},
  order: [],
  autoOpened: new Set(),

  registerArtifacts(list) {
    if (list.length === 0) return;
    set((s) => {
      const artifacts = { ...s.artifacts };
      const order = [...s.order];
      let changed = false;
      for (const artifact of list) {
        const existing = artifacts[artifact.id];
        if (!existing) order.push(artifact.id);
        if (
          !existing ||
          existing.code !== artifact.code ||
          existing.markdown !== artifact.markdown ||
          existing.html !== artifact.html ||
          existing.imageUrl !== artifact.imageUrl ||
          existing.title !== artifact.title
        ) {
          artifacts[artifact.id] = artifact;
          changed = true;
        }
      }
      return changed ? { artifacts, order } : s;
    });
  },

  openArtifact(id) {
    if (!get().artifacts[id]) return;
    set({ open: true, activeId: id, view: "preview" });
  },

  setView(view) {
    set({ view });
  },

  toggleCanvas() {
    set((s) => {
      if (s.open) return { open: false };
      const activeId = s.activeId ?? s.order[s.order.length - 1] ?? null;
      return activeId ? { open: true, activeId } : s;
    });
  },

  close() {
    set({ open: false });
  },

  noteAutoOpened(messageId) {
    set((s) => {
      if (s.autoOpened.has(messageId)) return s;
      const autoOpened = new Set(s.autoOpened);
      autoOpened.add(messageId);
      return { autoOpened };
    });
  },

  collapseForRoute() {
    if (get().open) set({ open: false });
  },
}));

export function activeArtifact(): CanvasArtifact | null {
  const { activeId, artifacts } = useCanvasStore.getState();
  return activeId ? (artifacts[activeId] ?? null) : null;
}
