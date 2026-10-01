"use client";

import { useEffect, useMemo } from "react";
import { Button, Card, Icon } from "@/components/ui";
import { useSpeechStore } from "@/stores/speech-store";
import { Section } from "./settings-view";

/**
 * Read-aloud voice controls — picks which installed `SpeechSynthesisVoice`
 * the "read aloud" button and hands-free voice conversation use, and tunes
 * rate/pitch. See `speech-store.ts` for why this exists: without an explicit
 * voice/lang, the browser's default (usually English) voice gets used for
 * every language, which for non-Latin text either mispronounces badly or
 * produces no audio at all.
 */
export function VoiceSection() {
  const supported = useSpeechStore((s) => s.supported);
  const detectSupport = useSpeechStore((s) => s.detectSupport);
  const voices = useSpeechStore((s) => s.voices);
  const preferredVoiceURI = useSpeechStore((s) => s.preferredVoiceURI);
  const setPreferredVoice = useSpeechStore((s) => s.setPreferredVoice);
  const rate = useSpeechStore((s) => s.rate);
  const setRate = useSpeechStore((s) => s.setRate);
  const pitch = useSpeechStore((s) => s.pitch);
  const setPitch = useSpeechStore((s) => s.setPitch);
  const speakingId = useSpeechStore((s) => s.speakingId);
  const previewVoice = useSpeechStore((s) => s.previewVoice);
  const stop = useSpeechStore((s) => s.stop);
  const error = useSpeechStore((s) => s.error);

  useEffect(() => {
    detectSupport();
  }, [detectSupport]);

  const sortedVoices = useMemo(
    () =>
      [...voices].sort(
        (a, b) => a.lang.localeCompare(b.lang) || a.name.localeCompare(b.name),
      ),
    [voices],
  );

  const selectedVoice =
    voices.find((v) => v.voiceURI === preferredVoiceURI) ?? null;
  const previewKey = `preview:${preferredVoiceURI ?? ""}`;
  const previewing = speakingId === previewKey;

  function handlePreview() {
    if (previewing) {
      stop();
      return;
    }
    previewVoice(preferredVoiceURI ?? "", selectedVoice?.lang ?? "en-US");
  }

  return (
    <Section
      title="Voice"
      description={`Controls the "read aloud" voice on assistant messages and hands-free voice conversation. Uses your browser/device's own installed voices — available languages and quality depend on what's installed there.`}
    >
      <Card className="space-y-4 p-5">
        {!supported ? (
          <div className="flex items-center gap-3">
            <Icon
              name="volume_off"
              size={18}
              className="text-on-surface-variant"
            />
            <p className="text-sm text-on-surface-variant">
              This browser does not support text-to-speech.
            </p>
          </div>
        ) : (
          <>
            <label className="block">
              <span className="text-xs font-medium text-on-surface-variant">
                Voice
              </span>
              <select
                value={preferredVoiceURI ?? ""}
                onChange={(e) => setPreferredVoice(e.target.value || null)}
                className="sl-field mt-1"
              >
                <option value="">
                  Auto (match each message&apos;s language)
                </option>
                {sortedVoices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
              {sortedVoices.length === 0 ? (
                <p className="mt-1 text-xs text-on-surface-variant">
                  No voices reported yet — some browsers load this list a
                  moment after the page opens. Try reopening this page.
                </p>
              ) : null}
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-medium text-on-surface-variant">
                  Speed — {rate.toFixed(2)}x
                </span>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={rate}
                  onChange={(e) => setRate(Number(e.target.value))}
                  className="mt-2 w-full accent-primary"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-on-surface-variant">
                  Pitch — {pitch.toFixed(2)}
                </span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={pitch}
                  onChange={(e) => setPitch(Number(e.target.value))}
                  className="mt-2 w-full accent-primary"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                iconLeft={previewing ? "stop" : "play_arrow"}
                onClick={handlePreview}
              >
                {previewing ? "Stop" : "Preview"}
              </Button>
              <p className="flex-1 text-xs text-on-surface-variant">
                Truly expressive, emotionally-inflected speech is not
                something a browser voice can do — this picks from whatever
                voices are installed on this device and lets you tune
                speed/pitch, the closest this gets without a paid neural
                voice service.
              </p>
            </div>

            {error ? (
              <p className="flex items-start gap-1.5 text-xs text-error">
                <Icon name="close" size={13} className="mt-0.5 shrink-0" />
                {error}
              </p>
            ) : null}
          </>
        )}
      </Card>
    </Section>
  );
}
