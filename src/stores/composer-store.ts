"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToolId } from "@/types/chat";

interface ComposerState {
  /** tools pre-enabled on the composer before a conversation exists */
  defaultTools: ToolId[];
  toggleDefaultTool: (id: ToolId) => void;
}

export const useComposerStore = create<ComposerState>()(
  persist(
    (set) => ({
      defaultTools: [],
      toggleDefaultTool: (id) =>
        set((s) => ({
          defaultTools: s.defaultTools.includes(id)
            ? s.defaultTools.filter((t) => t !== id)
            : [...s.defaultTools, id],
        })),
    }),
    { name: "slime-composer" },
  ),
);
