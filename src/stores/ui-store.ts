"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ContextTab = "files" | "sources" | "tools" | "activity";

interface UiState {
  /** mobile off-canvas panels */
  navDrawerOpen: boolean;
  contextDrawerOpen: boolean;
  /** desktop right panel */
  contextPanelCollapsed: boolean;
  contextTab: ContextTab;

  openNavDrawer: () => void;
  openContextDrawer: () => void;
  closeDrawers: () => void;
  toggleContextPanel: () => void;
  setContextTab: (tab: ContextTab) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      navDrawerOpen: false,
      contextDrawerOpen: false,
      contextPanelCollapsed: false,
      contextTab: "files",

      openNavDrawer: () =>
        set({ navDrawerOpen: true, contextDrawerOpen: false }),
      openContextDrawer: () =>
        set({ contextDrawerOpen: true, navDrawerOpen: false }),
      closeDrawers: () =>
        set({ navDrawerOpen: false, contextDrawerOpen: false }),
      toggleContextPanel: () =>
        set((s) => ({ contextPanelCollapsed: !s.contextPanelCollapsed })),
      setContextTab: (contextTab) => set({ contextTab }),
    }),
    {
      name: "slime-ui",
      // only persist durable layout prefs, never transient drawer state
      partialize: (s) => ({
        contextPanelCollapsed: s.contextPanelCollapsed,
        contextTab: s.contextTab,
      }),
    },
  ),
);
