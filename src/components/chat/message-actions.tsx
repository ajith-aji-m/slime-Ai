"use client";

import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui";
import { useSpeechStore } from "@/stores/speech-store";

export function MessageActions({
  messageId,
  speechText,
  onCopy,
  onRegenerate,
}: {
  /** required to drive the read-aloud toggle */
  messageId: string;
  /** plain text to read aloud; omit to hide the play button */
  speechText?: string;
  onCopy: () => void;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const supported = useSpeechStore((s) => s.supported);
  const detectSupport = useSpeechStore((s) => s.detectSupport);
  const speakingId = useSpeechStore((s) => s.speakingId);
  const speak = useSpeechStore((s) => s.speak);
  const speaking = speakingId === messageId;

  useEffect(() => {
    detectSupport();
  }, [detectSupport]);

  return (
    <div className="mt-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
      <IconButton
        icon={copied ? "check" : "content_copy"}
        label="Copy response"
        size="sm"
        onClick={() => {
          onCopy();
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        }}
      />
      {supported && speechText ? (
        <IconButton
          icon={speaking ? "volume_up" : "play_arrow"}
          label={speaking ? "Stop reading aloud" : "Read aloud"}
          active={speaking}
          size="sm"
          className={speaking ? "animate-pulse" : undefined}
          onClick={() => speak(messageId, speechText)}
        />
      ) : null}
      {onRegenerate ? (
        <IconButton
          icon="refresh"
          label="Regenerate response"
          size="sm"
          onClick={onRegenerate}
        />
      ) : null}
      <div className="mx-1 h-4 w-px bg-outline-variant" />
      <IconButton icon="thumb_up" label="Good response" size="sm" />
      <IconButton icon="thumb_down" label="Bad response" size="sm" />
    </div>
  );
}
