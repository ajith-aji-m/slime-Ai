"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon, SlimeMark } from "@/components/ui";
import { messageToPlainText } from "@/lib/utils/message-text";
import { toSpeechText } from "@/lib/speech/to-speech-text";
import { THINKING_PHRASES } from "@/config/thinking-phrases";
import { nextPhraseIndex } from "./slime-thinking";
import { useVoiceCallStore } from "@/stores/voice-call-store";
import { useDictationStore } from "@/stores/dictation-store";
import { useSpeechStore } from "@/stores/speech-store";
import { useConversationStore } from "@/stores/conversation-store";

type Phase = "listening" | "thinking" | "speaking" | "error";

/** How long to wait after the last recognized word before treating the turn
 * as finished and sending it — long enough not to cut off a mid-thought
 * pause, short enough that the back-and-forth still feels live. */
const SILENCE_MS = 1300;
const ROTATE_MS = 1800;

/**
 * Full-screen, hands-free voice conversation: listen → auto-send on a pause
 * (no typing, no Send tap) → speak the reply aloud → listen again. Built
 * entirely on the two existing browser-only stores — `dictation-store`
 * (SpeechRecognition) and `speech-store` (SpeechSynthesis) — plus the normal
 * `sendMessage` path; no new provider, no server change.
 *
 * Mounted once, globally (see `workspace-shell.tsx`), gated on
 * `useVoiceCallStore`'s `open` flag rather than being per-page — a call
 * started from the welcome screen has to survive the client-side navigation
 * to `/chat/[id]` that creating the first conversation triggers, which a
 * component local to that page wouldn't.
 *
 * All setState calls live inside plain, separately-defined functions
 * (`beginListening`, `commitTurn`, `enterError`, `enterSpeaking`...), never
 * written inline in a `useEffect` body — React Compiler's lint rules flag a
 * bare `setX(...)` statement directly inside an effect (cascading-render
 * risk) but not one reached through a named function call, which is also
 * just clearer about *why* each transition happens.
 */
export function VoiceCallOverlay() {
  const open = useVoiceCallStore((s) => s.open);
  const conversationId = useVoiceCallStore((s) => s.conversationId);
  const bindConversation = useVoiceCallStore((s) => s.bindConversation);
  const closeCall = useVoiceCallStore((s) => s.close);
  const router = useRouter();

  const dictationStart = useDictationStore((s) => s.start);
  const dictationStop = useDictationStore((s) => s.stop);
  const dictationListening = useDictationStore((s) => s.listening);
  const dictationErrorMessage = useDictationStore((s) => s.error);

  const speechSupported = useSpeechStore((s) => s.supported);
  const speakingId = useSpeechStore((s) => s.speakingId);
  const speak = useSpeechStore((s) => s.speak);
  const speechStop = useSpeechStore((s) => s.stop);

  const streaming = useConversationStore((s) =>
    conversationId ? s.streamingIds.has(conversationId) : false,
  );
  const liveReplyText = useConversationStore((s) => {
    if (!conversationId) return "";
    const convo = s.conversations[conversationId];
    const last = convo?.messages[convo.messages.length - 1];
    return last?.role === "assistant" ? messageToPlainText(last) : "";
  });

  const [phase, setPhase] = useState<Phase>("listening");
  const [interim, setInterim] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [thinkingPhraseIndex, setThinkingPhraseIndex] = useState(0);

  const committedRef = useRef("");
  const interimRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speakingMessageIdRef = useRef<string | null>(null);
  const wasStreamingRef = useRef(false);
  const wasDictationListeningRef = useRef(false);
  const turnConversationIdRef = useRef<string | null>(conversationId);

  useEffect(() => {
    turnConversationIdRef.current = conversationId;
  }, [conversationId]);

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  // Plain functions, recreated every render on purpose — they close over the
  // current render's state/props directly, so there's no stale-closure risk.
  // `handlersRef` (populated in an effect below, never written during
  // render) hands async callbacks — a setTimeout, a dictation chunk — a way
  // to call the *latest* version without needing these in a dependency
  // array, which — since they're new on every render — would make an effect
  // depending on them fire on every unrelated render too.

  function enterError(message: string) {
    setPhase("error");
    setErrorMessage(message);
  }

  function enterSpeaking(messageId: string, text: string) {
    speakingMessageIdRef.current = messageId;
    setPhase("speaking");
    speak(messageId, text);
  }

  function beginListening() {
    clearSilenceTimer();
    committedRef.current = "";
    interimRef.current = "";
    setInterim("");
    setErrorMessage(null);
    setPhase("listening");
    dictationStart((text, final) => {
      clearSilenceTimer();
      if (final) {
        committedRef.current = committedRef.current
          ? `${committedRef.current} ${text}`.trim()
          : text.trim();
        interimRef.current = "";
        setInterim("");
      } else {
        interimRef.current = text;
        setInterim(text);
      }
      silenceTimerRef.current = setTimeout(
        () => handlersRef.current.commitTurn(),
        SILENCE_MS,
      );
    });
  }

  async function commitTurn() {
    clearSilenceTimer();
    dictationStop();
    const text = (committedRef.current || interimRef.current).trim();
    committedRef.current = "";
    interimRef.current = "";
    setInterim("");

    if (!text) {
      enterError("Didn't catch that — tap the mic to try again.");
      return;
    }

    let id = turnConversationIdRef.current;
    if (!id) {
      id = useConversationStore.getState().createConversation({ tools: [] });
      turnConversationIdRef.current = id;
      bindConversation(id);
      router.push(`/chat/${id}`);
    }
    setPhase("thinking");
    const tools = useConversationStore.getState().conversations[id]?.tools ?? [];
    await useConversationStore.getState().sendMessage(id, text, { tools });
  }

  function endCall() {
    clearSilenceTimer();
    dictationStop();
    speechStop();
    closeCall();
  }

  const handlersRef = useRef({ beginListening, commitTurn, enterError });
  useEffect(() => {
    handlersRef.current = { beginListening, commitTurn, enterError };
  });

  // Open/close: start the first turn's listening on open, tear everything
  // down on close or unmount. `beginListening` already sets phase to
  // "listening" itself — nothing else needs to happen here.
  useEffect(() => {
    if (!open) return;
    handlersRef.current.beginListening();
    return () => {
      clearSilenceTimer();
      dictationStop();
      speechStop();
    };
    // Deliberately only `open` — see the `handlersRef` note above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Assistant finished streaming → speak the reply (or the error message),
  // then resume listening once speech ends (below). Skips straight back to
  // listening only when there's genuinely nothing to say aloud.
  useEffect(() => {
    if (!open) return;
    if (wasStreamingRef.current && !streaming) {
      const id = turnConversationIdRef.current;
      const convo = id ? useConversationStore.getState().conversations[id] : undefined;
      const last = convo?.messages[convo.messages.length - 1];
      const text =
        last?.role === "assistant"
          ? last.status === "error"
            ? last.error ?? "Something went wrong."
            : toSpeechText(last)
          : "";
      if (text && speechSupported && last) {
        enterSpeaking(last.id, text);
      } else {
        handlersRef.current.beginListening();
      }
    }
    wasStreamingRef.current = streaming;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streaming, open, speechSupported]);

  // Speech finished (naturally, or the user tapped to interrupt) → resume
  // listening for the next turn.
  useEffect(() => {
    if (!open) return;
    if (speakingMessageIdRef.current && speakingId !== speakingMessageIdRef.current) {
      speakingMessageIdRef.current = null;
      handlersRef.current.beginListening();
    }
  }, [speakingId, open]);

  // A rotating filler phrase for the "thinking" readout before any reply
  // text has streamed in yet — same look/cadence as `SlimeThinking`.
  useEffect(() => {
    if (phase !== "thinking" || liveReplyText) return;
    const id = setInterval(() => {
      setThinkingPhraseIndex((i) => nextPhraseIndex(i, THINKING_PHRASES.length));
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [phase, liveReplyText]);

  // Surface a real dictation failure as this overlay's own error state
  // (distinct from the composer's — this is a modal, nothing else to show
  // it in) rather than silently sitting in "listening" with no feedback.
  useEffect(() => {
    if (!open || phase !== "listening" || !dictationErrorMessage) return;
    handlersRef.current.enterError(dictationErrorMessage);
  }, [dictationErrorMessage, open, phase]);

  // Some browsers end a `continuous` recognition session on their own after
  // a while even with no error (a built-in cap, not a failure) — without
  // this, that would leave the UI sitting on a dead "Listening…" forever.
  // Only reacts to an actual true→false *transition* (the
  // `wasDictationListeningRef` guard), never to "currently not listening",
  // since that's also true for the instant before the first turn's
  // `beginListening()` call has had a chance to run. Skipped when there's a
  // real error — the effect above already handles that case, and letting
  // both fire would race to set two different error messages.
  useEffect(() => {
    if (open && phase === "listening" && !dictationErrorMessage) {
      if (wasDictationListeningRef.current && !dictationListening) {
        void handlersRef.current.commitTurn();
      }
    }
    wasDictationListeningRef.current = dictationListening;
  }, [dictationListening, open, phase, dictationErrorMessage]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") endCall();
    }
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const statusText =
    phase === "listening"
      ? interim || "Listening…"
      : phase === "thinking"
        ? liveReplyText || THINKING_PHRASES[thinkingPhraseIndex]
        : phase === "speaking"
          ? liveReplyText
          : (errorMessage ?? "Something went wrong.");

  const phaseLabel =
    phase === "listening"
      ? "Listening"
      : phase === "thinking"
        ? "Thinking…"
        : phase === "speaking"
          ? "Speaking"
          : "Paused";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Voice conversation"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-7 bg-[var(--sl-background)]/95 px-6 py-10 backdrop-blur-xl"
    >
      <button
        type="button"
        aria-label="End voice conversation"
        onClick={endCall}
        className="liquid-inner absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <Icon name="close" size={20} />
      </button>

      <button
        type="button"
        onClick={() => {
          if (phase === "speaking") speechStop();
        }}
        aria-label={
          phase === "speaking" ? "Interrupt and start talking" : phaseLabel
        }
        className="relative flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--sl-mode-ring)]"
      >
        <span
          className={cn(
            "absolute inset-0 -m-4 rounded-full blur-2xl transition-opacity duration-500",
            phase === "listening" || phase === "speaking"
              ? "animate-pulse opacity-70"
              : "opacity-40",
          )}
          style={{ background: "var(--sl-mode-glow)" }}
          aria-hidden
        />
        <SlimeMark
          size={128}
          ripple
          mood={
            phase === "thinking"
              ? "typing"
              : phase === "error"
                ? "error"
                : "idle"
          }
        />
        {phase === "listening" || phase === "speaking" ? (
          <span
            className={cn(
              "liquid-inner absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-full text-primary",
              "animate-pulse",
            )}
            aria-hidden
          >
            <Icon name={phase === "listening" ? "mic" : "volume_up"} size={18} />
          </span>
        ) : null}
      </button>

      <div className="max-w-md text-center" aria-live="polite">
        <p className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant/70">
          {phaseLabel}
        </p>
        <p
          className={cn(
            "mt-2 min-h-6 text-[15px]",
            phase === "error" ? "text-error" : "text-on-surface",
          )}
        >
          {statusText}
        </p>
      </div>

      {phase === "error" ? (
        <button
          type="button"
          onClick={() => handlersRef.current.beginListening()}
          className="liquid-inner flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold text-primary transition-[background-color,box-shadow] hover:bg-glass-hover"
        >
          <Icon name="mic" size={18} />
          Tap to try again
        </button>
      ) : null}
    </div>
  );
}
