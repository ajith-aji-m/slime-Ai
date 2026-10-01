/**
 * Ambient types for the (non-standard, Chromium/Safari-only) SpeechRecognition
 * Web API used by `src/stores/dictation-store.ts` for voice-to-text input.
 * TypeScript's bundled `lib.dom.d.ts` already has the result-list pieces
 * (`SpeechRecognitionResult`, `SpeechRecognitionResultList`,
 * `SpeechRecognitionAlternative`) but not the recognizer itself or its event
 * types — no W3C standard exists yet for this API, so it was never added.
 * This file is a global ambient script (no top-level import/export), so these
 * merge straight into the global scope without a `declare global` wrapper.
 *
 * Kept intentionally minimal — only what this app actually uses.
 */

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
}

declare const SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition?: typeof SpeechRecognition;
  webkitSpeechRecognition?: typeof SpeechRecognition;
}
