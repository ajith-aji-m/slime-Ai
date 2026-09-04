"use client";

import { usePathname } from "next/navigation";
import { activeModeTool } from "@/config/tools";
import { useConversationStore } from "@/stores/conversation-store";
import { useComposerStore } from "@/stores/composer-store";
import type { ToolId } from "@/types/chat";

function conversationIdFromPath(pathname: string): string | undefined {
  return pathname.match(/^\/chat\/([^/]+)/)?.[1];
}

/**
 * The single active mode tool (Search / Code / Image Gen / Research) for
 * whatever the composer would send right now — the open conversation's tools
 * if there is one, otherwise the default tools for a not-yet-created chat.
 * Reads the same shared state the composer and Intelligence panel write to,
 * so mode-driven theming can never disagree with what's shown there.
 */
export function useActiveToolMode(): ToolId | undefined {
  const pathname = usePathname();
  const conversationId = conversationIdFromPath(pathname);
  const conversationTools = useConversationStore((s) =>
    conversationId ? s.conversations[conversationId]?.tools : undefined,
  );
  const defaultTools = useComposerStore((s) => s.defaultTools);
  return activeModeTool(conversationTools ?? defaultTools);
}
