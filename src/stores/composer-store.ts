"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ToolId } from "@/types/chat";
import { toggleToolInList } from "@/lib/tool-mode";

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
        set((s) => ({ defaultTools: toggleToolInList(s.defaultTools, id) })),
    }),
    { name: "slime-composer" },
  ),
);
