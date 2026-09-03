"use client";

import { useEffect, useMemo, useRef } from "react";
import type { Message } from "@/types/chat";
import { planMessageDisplay, type DisplayPart } from "@/lib/canvas/detect";
import { useCanvasStore } from "@/stores/canvas-store";

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

  const { displayParts, artifacts } = useMemo(() => {
    const plan = planMessageDisplay(message);
    return {
      displayParts: plan.displayParts,
      artifacts: plan.artifacts.map((a) => ({ ...a, conversationId })),
    };
  }, [message, conversationId]);

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
