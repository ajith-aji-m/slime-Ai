/**
 * Thin wrapper over `@mintplex-labs/piper-tts-web` (MIT) — a real
 * open-source neural TTS engine (Rhasspy's Piper, VITS-based voice models,
 * also MIT) running entirely in the browser via WebAssembly/ONNX Runtime.
 * No server call, no API key, genuinely smoother/more natural than the
 * OS's built-in `SpeechSynthesis` voices for the languages it covers.
 *
 * Always dynamically imported (`loadPiper()`), never a static top-level
 * import — the package's own README says plainly it "will not work with
 * NodeJS", and its `onnxruntime-web` dependency is a meaningfully sized
 * chunk that the majority of users (who stick with the free default
 * "browser" engine) should never have to download.
 *
 * Coverage gap, stated plainly rather than discovered the hard way: the
 * published Piper voice set (`listPiperVoices()`) does not include Tamil,
 * Hindi, or most other Indic languages — only what Rhasspy's community has
 * actually trained models for (mostly European languages, plus a handful
 * of others — see `PIPER_LANGUAGE_CODES`). `speech-store.ts` only routes an
 * utterance through Piper when the configured Piper voice's own language
 * matches the text's detected language; everything else still falls back
 * to the "browser" engine, same as it already did.
 *
 * On first use of any given voice, its model files (tens of MB) download
 * from Hugging Face and get cached in the Origin Private File System — free
 * (no server bandwidth cost to this app) but genuinely sizable; every
 * caller should show `onProgress` somewhere rather than let the UI look
 * stuck.
 */

import type { Voice, VoiceId } from "@mintplex-labs/piper-tts-web";

export type { Voice, VoiceId };

let piperModule: typeof import("@mintplex-labs/piper-tts-web") | null = null;

async function loadPiper() {
  if (!piperModule) {
    piperModule = await import("@mintplex-labs/piper-tts-web");
  }
  return piperModule;
}

/**
 * Primary BCP-47-ish subtags Piper's published voice set covers (derived
 * from its `VoiceId` union at the time this was written — not fetched live,
 * so a future Piper release adding a language won't show up here until this
 * list is updated by hand). Used for a fast, synchronous "could Piper even
 * handle this language" check in `speech-store.ts`'s `speak()` — notably,
 * no Indic languages (Tamil, Hindi, Telugu, …) and no Japanese/Korean are
 * in Piper's catalog as published.
 */
export const PIPER_LANGUAGE_CODES = new Set([
  "ar", "ca", "cs", "da", "de", "el", "en", "es", "fa", "fi", "fr", "hu",
  "is", "it", "ka", "kk", "lb", "ne", "nl", "no", "pl", "pt", "ro", "ru",
  "sk", "sl", "sr", "sv", "sw", "tr", "uk", "vi", "zh",
]);

/** A Piper `VoiceId` is `"<lang>_<REGION>-<name>-<quality>"`, e.g.
 * `"en_US-hfc_female-medium"` — this reads just the `<lang>` part. */
export function piperVoiceLang(voiceId: string): string {
  return voiceId.split("_")[0]?.toLowerCase() ?? "";
}

/** A sensible, known-good built-in default so "Piper" has something to
 * speak with the moment a user switches engines, before they have picked
 * their own voice in Settings — the exact example voice from the
 * package's own README. */
export const DEFAULT_PIPER_VOICE_ID: VoiceId = "en_US-hfc_female-medium";

/** Every voice Piper publishes (fetched from Hugging Face; also populates
 * the package's own local fallback cache for next time). */
export async function listPiperVoices(): Promise<Voice[]> {
  const piper = await loadPiper();
  return piper.voices();
}

/** Voice ids whose model files are already cached in OPFS — no download
 * needed for the next `synthesizePiper()` call. */
export async function storedPiperVoices(): Promise<VoiceId[]> {
  const piper = await loadPiper();
  return piper.stored();
}

export async function downloadPiperVoice(
  voiceId: VoiceId,
  onProgress?: (fraction: number) => void,
): Promise<void> {
  const piper = await loadPiper();
  await piper.download(voiceId, (p) =>
    onProgress?.(p.total > 0 ? p.loaded / p.total : 0),
  );
}

export async function removePiperVoice(voiceId: VoiceId): Promise<void> {
  const piper = await loadPiper();
  await piper.remove(voiceId);
}

/** Synthesizes `text` with `voiceId` — downloads the model first if it is
 * not already cached (see `onProgress`) — and returns a playable WAV Blob. */
export async function synthesizePiper(
  text: string,
  voiceId: VoiceId,
  onProgress?: (fraction: number) => void,
): Promise<Blob> {
  const piper = await loadPiper();
  return piper.predict({ text, voiceId }, (p) =>
    onProgress?.(p.total > 0 ? p.loaded / p.total : 0),
  );
}

/** Rough feature-detect: Piper needs WebAssembly, Web Workers and the
 * Origin Private File System (for model caching) — present in any
 * reasonably current browser, but worth checking explicitly rather than
 * letting a cryptic WASM load failure be the first sign something's
 * missing. */
export function piperEnvironmentSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof WebAssembly !== "undefined" &&
    typeof Worker !== "undefined" &&
    typeof navigator !== "undefined" &&
    "storage" in navigator &&
    typeof navigator.storage?.getDirectory === "function"
  );
}
