"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_RETENTION, type RetentionPolicy } from "@/config/retention";

interface SettingsState {
  displayName: string;
  email: string;
  retention: RetentionPolicy;
  /** future paid capability — read-only in this build */
  syncTier: "local" | "cloud-backup" | "cloud-sync";

  setProfile: (patch: Partial<Pick<SettingsState, "displayName" | "email">>) => void;
  setRetention: (patch: Partial<RetentionPolicy>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      displayName: "You",
      email: "",
      retention: DEFAULT_RETENTION,
      syncTier: "local",
      setProfile: (patch) => set(patch),
      setRetention: (patch) =>
        set((s) => ({ retention: { ...s.retention, ...patch } })),
    }),
    { name: "slime-settings" },
  ),
);
