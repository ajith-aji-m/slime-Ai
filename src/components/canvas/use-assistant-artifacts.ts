"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Message } from "@/types/chat";
import { activeModeTool } from "@/config/tools";
import { planMessageDisplay, type DisplayPart } from "@/lib/canvas/detect";
import { messageToPlainText } from "@/lib/utils/message-text";
import { useCanvasStore } from "@/stores/canvas-store";
import { useConversationStore } from "@/stores/conversation-store";

/**
 * Derives the Canvas artifacts for one assistant message, keeps the Canvas
 * registry in sync, auto-opens Canvas the first time the *latest* message
 * finishes with an artifact, and returns the parts the chat thread should show
 * (large artifacts collapsed to compact "Open in Canvas" cards).
 */
export function useAssistantArtifacts(
  message: Message,
  conversationId: string,
  isLast: boolean,
): DisplayPart[] {
  const registerArtifacts = useCanvasStore((s) => s.registerArtifacts);
  const openArtifact = useCanvasStore((s) => s.openArtifact);
  const noteAutoOpened = useCanvasStore((s) => s.noteAutoOpened);

  // When the conversation is in Humanizer mode, the text this assistant message
  // rewrote is the user message just before it — that's the diff baseline.
  const humanizerOriginal = useConversationStore((s) => {
    const conversation = s.conversations[conversationId];
    if (!conversation || activeModeTool(conversation.tools) !== "humanizer") {
      return undefined;
    }
    const index = conversation.messages.findIndex((m) => m.id === message.id);
    if (index <= 0) return undefined;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (conversation.messages[i].role === "user") {
        return messageToPlainText(conversation.messages[i]) || undefined;
      }
    }
    return undefined;
  });

  const { displayParts, artifacts } = useMemo(() => {
    const plan = planMessageDisplay(message, { humanizerOriginal });
    return {
      displayParts: plan.displayParts,
      artifacts: plan.artifacts.map((a) => ({ ...a, conversationId })),
    };
  }, [message, conversationId, humanizerOriginal]);

  useEffect(() => {
    registerArtifacts(artifacts);
  }, [artifacts, registerArtifacts]);

  // Auto-open Canvas only on a fresh streaming→complete transition — never when
  // re-opening a conversation whose last message already carries an artifact.
  const sawStreaming = useRef(false);
  useEffect(() => {
    if (message.status === "streaming") sawStreaming.current = true;
  }, [message.status]);

  useEffect(() => {
    if (
      message.status !== "complete" ||
      !isLast ||
      !sawStreaming.current ||
      artifacts.length === 0 ||
      useCanvasStore.getState().autoOpened.has(message.id)
    ) {
      return;
    }
    noteAutoOpened(message.id);
    openArtifact(artifacts[artifacts.length - 1].id);
  }, [message.status, message.id, isLast, artifacts, openArtifact, noteAutoOpened]);

  return displayParts;
}
