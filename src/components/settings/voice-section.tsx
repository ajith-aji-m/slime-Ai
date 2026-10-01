"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Card, Chip, Icon } from "@/components/ui";
import { useSpeechStore } from "@/stores/speech-store";
import {
  listPiperVoices,
  piperEnvironmentSupported,
  storedPiperVoices,
  type Voice as PiperVoice,
} from "@/lib/speech/piper";
import { cn } from "@/lib/utils/cn";
import { Section } from "./settings-view";

/**
 * Read-aloud voice controls — picks which engine and voice the "read aloud"
 * button and hands-free voice conversation use, and tunes rate/pitch. See
 * `speech-store.ts` for why the language-detection/voice-matching exists:
 * without an explicit voice/lang, the browser's default (usually English)
 * voice gets used for every language, which for non-Latin text either
 * mispronounces badly or produces no audio at all.
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
  const engine = useSpeechStore((s) => s.engine);
  const setEngine = useSpeechStore((s) => s.setEngine);

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
      description={`Controls the "read aloud" voice on assistant messages and hands-free voice conversation.`}
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
            <div className="flex gap-2">
              <EngineButton
                active={engine === "browser"}
                onClick={() => setEngine("browser")}
                label="Browser"
              />
              <EngineButton
                active={engine === "piper"}
                onClick={() => setEngine("piper")}
                label="Piper (open-source)"
              />
            </div>

            {engine === "browser" ? (
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
                <p className="text-xs text-on-surface-variant">
                  Uses your browser/device&apos;s own installed voices —
                  available languages and quality depend on what&apos;s
                  installed there. Instant, free, works offline.
                </p>
              </>
            ) : (
              <PiperVoicePicker />
            )}

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

            {engine === "browser" ? (
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
                  something either voice engine here can do — this picks a
                  voice and lets you tune speed/pitch, the closest either
                  gets without a paid neural voice service.
                </p>
              </div>
            ) : null}

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

function EngineButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-primary bg-primary-container/15 text-primary"
          : "border-outline-variant text-on-surface-variant hover:bg-surface-variant",
      )}
    >
      {label}
    </button>
  );
}

/**
 * The Piper engine's own voice picker. Fetches the published voice list
 * from Hugging Face on mount (see `listPiperVoices()`) — this is the one
 * part of Settings that needs real network access, so it has its own
 * loading/error state rather than assuming the fetch always succeeds.
 */
function PiperVoicePicker() {
  const piperVoiceId = useSpeechStore((s) => s.piperVoiceId);
  const setPiperVoiceId = useSpeechStore((s) => s.setPiperVoiceId);
  const speakingId = useSpeechStore((s) => s.speakingId);
  const piperDownloadProgress = useSpeechStore((s) => s.piperDownloadProgress);
  const previewPiperVoice = useSpeechStore((s) => s.previewPiperVoice);
  const stop = useSpeechStore((s) => s.stop);

  const [voiceList, setVoiceList] = useState<PiperVoice[] | null>(null);
  const [stored, setStored] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  // Not useState+useEffect: this component only ever mounts client-side —
  // `engine` (gating whether it renders at all) defaults to "browser" for
  // both SSR and the very first client render, only becoming "piper" after
  // the persisted store rehydrates from localStorage post-mount — so there
  // is no SSR/hydration-mismatch risk to guard against here the way there
  // would be for something unconditionally rendered from the first paint.
  const envSupported = piperEnvironmentSupported();

  useEffect(() => {
    let cancelled = false;
    listPiperVoices()
      .then((list) => {
        if (!cancelled) setVoiceList(list);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(
            "Couldn't load the Piper voice list — check your connection and reopen this page.",
          );
        }
      });
    storedPiperVoices()
      .then((ids) => {
        if (!cancelled) setStored(ids);
      })
      .catch(() => {
        /* non-critical — just skips the "downloaded" badge */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(
    () =>
      (voiceList ?? [])
        .slice()
        .sort(
          (a, b) =>
            a.language.name_english.localeCompare(b.language.name_english) ||
            a.name.localeCompare(b.name),
        ),
    [voiceList],
  );

  const previewKey = `piper-preview:${piperVoiceId}`;
  const previewing = speakingId === previewKey;
  const downloading = piperDownloadProgress !== null;

  function handlePreview() {
    if (previewing) {
      stop();
      return;
    }
    previewPiperVoice(piperVoiceId);
  }

  if (!envSupported) {
    return (
      <p className="text-xs text-error">
        Piper needs WebAssembly, Web Workers and the Origin Private File
        System — not available in this browser. Use the Browser engine
        instead.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-xs font-medium text-on-surface-variant">
          Voice
        </span>
        {loadError ? (
          <p className="mt-1 text-xs text-error">{loadError}</p>
        ) : voiceList === null ? (
          <p className="mt-1 text-xs text-on-surface-variant">
            Loading voice list…
          </p>
        ) : (
          <select
            value={piperVoiceId}
            onChange={(e) => setPiperVoiceId(e.target.value)}
            className="sl-field mt-1"
          >
            {sorted.map((v) => (
              <option key={v.key} value={v.key}>
                {v.name} — {v.language.name_english} ({v.quality})
                {stored.includes(v.key) ? " · downloaded" : ""}
              </option>
            ))}
          </select>
        )}
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="sm"
          variant="outline"
          iconLeft={previewing ? "stop" : "play_arrow"}
          disabled={voiceList === null}
          onClick={handlePreview}
        >
          {previewing ? "Stop" : "Preview"}
        </Button>
        {downloading ? (
          <Chip className="text-xs">
            Downloading voice — {Math.round((piperDownloadProgress ?? 0) * 100)}%
          </Chip>
        ) : null}
      </div>

      <p className="text-xs text-on-surface-variant">
        A real open-source neural voice (Rhasspy&apos;s Piper, MIT-licensed)
        running entirely in this browser via WebAssembly — noticeably
        smoother than most built-in browser voices, still free, still no
        server call. First use of a voice downloads its model (tens of MB)
        and caches it on this device after. Covers English and a set of
        mostly European languages (shown above) —{" "}
        <strong>not Tamil, Hindi, or most other Indic languages</strong>;
        anything outside this voice&apos;s language automatically falls back
        to the Browser engine instead, same as if Piper were off.
      </p>
    </div>
  );
}
