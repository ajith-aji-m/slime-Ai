"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_MODEL_ID } from "@/config/providers";
import type { ToolId } from "@/types/chat";

interface ModelState {
  /** model used for the next new conversation */
  defaultModelId: string;
  /** tools pre-enabled on the composer before a conversation exists */
  defaultTools: ToolId[];
  setDefaultModel: (id: string) => void;
  toggleDefaultTool: (id: ToolId) => void;
}

export const useModelStore = create<ModelState>()(
  persist(
    (set) => ({
      defaultModelId: DEFAULT_MODEL_ID,
      defaultTools: [],
      setDefaultModel: (defaultModelId) => set({ defaultModelId }),
      toggleDefaultTool: (id) =>
        set((s) => ({
          defaultTools: s.defaultTools.includes(id)
            ? s.defaultTools.filter((t) => t !== id)
            : [...s.defaultTools, id],
        })),
    }),
    { name: "slime-model" },
  ),
);
