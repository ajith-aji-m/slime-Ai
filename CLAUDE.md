# Slime AI

Premium multi-model AI workstation. Next.js 16 (App Router) · TypeScript · Tailwind v4 · Zustand.
Local-first: chat history lives in the browser (IndexedDB). No real AI APIs yet — a mock
streaming provider answers.

## Source of truth for design

`template/` holds the current Stitch export — the **"Liquid Aqua" deep-ocean
glassmorphism** design (do not delete):

- `template/code.html` — the reference markup + the `.liquid-glass` /
  `.liquid-glass-inner` / `.liquid-pill-active` rules + the `slime` (sky) colour
  scale. Ported into tokens in `src/app/globals.css`.
- `template/screen.png` — the reference screen (welcome / new conversation, Search mode).

The theme is a single **light "Arctic" aqua** "liquid glass" surface (deep-navy
text on a pale sky wash, sky/indigo accents, three frosted-white glass panels
floating over an animated ambient backdrop with a `p-3.5`/`gap-3.5` gutter). It
lives in `:root` — there is no separate dark theme any more (the `template/`
export is the older dark ocean look; the palette has since been flipped to
light — keep the glass *structure*, not the dark values). Ambient life is
`body` + `body::before` (drifting blobs). Component overlays use the
`--sl-tint-line` / `--sl-tint-hover` / `--sl-tint-fill` tokens (Tailwind
`*-glass-line` / `*-glass-hover` / `*-glass-fill`), never raw `white/N`. Per-mode
accent shifts (Search sky · Code teal · Research amber · Image Gen magenta ·
Humanizer indigo · Prompt Gen red) are `[data-mode]` blocks that move only the accent family, the
`--sl-slime-*` mascot gradient and the ambient glow, and interpolate via
`@property`. Font is Inter. Preserve this visual language.

`stitch_lumina_ai_workspace/` (the earlier violet light design) is gone; ignore
older references to it or to `[data-theme="dark"]`.

## Architecture

| Path | Purpose |
| --- | --- |
| `src/app/(workspace)/` | Authenticated shell routes (sidebar + main + Intelligence panel) |
| `src/app/login`, `src/app/get-started` | Pre-workspace flows (mock auth, onboarding) |
| `src/components/ui/` | Design-system primitives |
| `src/components/layout/` | Shell: sidebar, top bar, drawers, page wrappers |
| `src/components/chat/` | Composer, message list, message parts, markdown/code/table |
| `src/components/context-panel/` | Files / Sources / Tools / Activity tabs |
| `src/components/canvas/` | Canvas workspace: shell/header/content + per-type views (code/html/table/report/image) + in-chat `CanvasReference` |
| `src/lib/canvas/` | Artifact detection from assistant messages (`detect.ts`), table parsing, export helpers |
| `src/lib/ai/` | `ChatProvider` interface + `mockChatProvider` (registry keyed by providerId) |
| `src/lib/storage/` | `ConversationStore` interface + IndexedDB adapter + retention job |
| `src/stores/` | Zustand: conversations, ui, model, settings, canvas, ai-status |
| `src/config/` | Static config (nav, providers/models, tools, suggestions, retention) |
| `src/data/` | Mock content — never import into `ui/` primitives |
| `src/types/` | Domain types (chat, provider, workspace, storage) |

## AI providers + internal router

Users never see or pick a model. The composer only ever says "Slime AI".

```
Chat UI → conversation-store → getChatProvider()        (no model id)
  ├─ mode "mock"          → mockChatProvider  (browser, offline)
  └─ mode "nvidia"/"groq" → httpChatProvider  (browser) → POST /api/chat (server)
                              → src/lib/ai/server/router.ts  (Internal AI Router)
                                 → src/lib/ai/server/provider.ts resolves the
                                   ACTIVE upstream (AI_PROVIDER + which
                                   key(s) are set — see below)
                                 classify task → pick a model from that
                                 provider's registry → stream
                                 → recoverable failure? fall back to next
                                   model, same provider (cap 3)
                                 → NDJSON StreamChunk
```

- Client never imports a provider SDK, an API key, or a model name — it does
  learn WHICH provider is active (`mode: "nvidia" | "groq" | "mock"` from
  `/api/ai/status`), but only because `getChatProvider` already had to react
  to that distinction to route to the real backend at all vs. the mock; no
  model name ever crosses. **If a third provider is ever added**, go on
  naming it explicitly in `mode` too, for the same reason — but
  `getChatProvider` itself must keep checking `!== "mock"`, never one
  specific provider name, or a correctly-configured-but-unlisted provider
  silently falls back to the offline mock (this exact bug existed before the
  Groq switch — `getChatProvider` checked `=== "nvidia"` specifically,
  which would have quietly broken the moment any other provider existed).
- Two interchangeable upstreams today, both OpenAI-compatible and both
  routed through the identical role-id-based `CATEGORY_ROUTING`/
  `CATEGORY_SAMPLING` policy (`src/config/ai-router.ts`) — switching
  provider never means switching routing logic:
  - **NVIDIA** (`src/lib/ai/server/nvidia.ts`) — the original/default
    integration, `src/config/models.ts`'s `DEFAULT_NVIDIA_MODELS` +
    `NVIDIA_MODELS` env override. Also the only provider Image Generation
    ever uses (NVIDIA's per-model image invoke-URL dialect — see
    `routeImageGeneration` in `router.ts`), regardless of which provider is
    active for ordinary chat.
  - **Groq** (`src/lib/ai/server/groq.ts`) — `DEFAULT_GROQ_MODELS` +
    `GROQ_MODELS` env override, same role-id namespace as NVIDIA's registry
    on purpose (`slime-general`, `slime-fast`, …) so the identical routing
    policy applies unchanged.
  - `src/lib/ai/server/provider.ts`'s `activeProvider()` resolves which one
    from `AI_PROVIDER` ("the switch") + which API key(s) are actually set
    (an explicit choice wins if that key is configured; otherwise falls
    back to whichever IS configured rather than the mock). Every
    provider-agnostic path in `router.ts` (`planModels`, `routeVision`,
    the main `routeChat` loop) goes through `activeRegistry()` /
    `streamActiveModel()` / `streamActiveVision()` from this file instead of
    importing a specific provider directly.
- `GET /api/ai/status` → `{ mode, imageGeneration, webSearch }` (capability
  flags; `mode` names the active upstream as above). `ai-status-store`
  consumes it.
- Model ids live ONLY in `src/config/models.ts` + the `NVIDIA_MODELS` /
  `GROQ_MODELS` env vars.
- Routing policy (category → ordered roles, attempt cap) is `src/config/ai-router.ts`.
- Server code in `src/lib/ai/server/*` is `import "server-only"`.
- Dev-only routing logs: `[ai-router] …` (role ids, categories, provider, reasons, timings — never secrets). Silent in production.

### Add the next provider

1. `src/lib/ai/server/<name>.ts` — `stream<Name>Model({ upstreamId, messages, signal })`
   (reuse `streamOpenAICompatible` if OpenAI-shaped) + an `is<Name>Configured()`/
   `<name>Registry()` pair, mirroring `groq.ts`.
2. Add a `DEFAULT_<NAME>_MODELS` registry to `src/config/models.ts`, same
   role-id namespace as the existing ones.
3. Wire it into `activeProvider()`/`activeRegistry()`/`streamActiveModel()` in
   `src/lib/ai/server/provider.ts` — `router.ts` itself shouldn't need to
   change.
4. Document env vars in `.env.example` + `src/lib/ai/server/env.ts`.
5. Widen `AiMode` (`ai-status-store.ts` + `registry.ts`) to include it, and
   confirm `getChatProvider` (`src/lib/ai/index.ts`) still checks
   `!== "mock"` rather than naming a provider — see the warning above.

Nothing else in the UI changes.

### Auto-titling

A new conversation's title starts as a naive instant guess — `mockTitleFromPrompt`
truncates the first user message to ~40 chars, set synchronously in
`sendMessage` so the sidebar has *something* before the first reply even
starts streaming. That guess is often bad ("can you help me with…" says
nothing), so `conversation-store`'s `runStream` corrects it once real
context exists: after an assistant turn completes (never on an aborted/error
turn), `shouldAutoTitle(messageCount)` fires at message count 2, 4, 6, 8, 10
(first exchange, then a few more early checkpoints in case the topic only
becomes clear a couple of turns in — never beyond 10, the topic has settled
by then) and `autoTitleConversation` calls `generateConversationTitle`
(`src/lib/ai/title.ts`) with the conversation's real messages, fire-and-forget.

- Routed providers: a dedicated category, `title` (`src/config/ai-router.ts`
  — routed to `slime-fast` first, since this is a cheap background task
  never shown mid-stream, plus a lowered sampling temperature since a title
  has one reasonable literal answer, not room for a creative riff), via a
  one-shot **non-streaming** `POST /api/title` → `routeTitle()` in
  `router.ts`. Unlike `routeChat`, nothing here ever reaches the UI
  word-by-word, so it isn't worth streaming — `routeTitle` just consumes the
  category's normal model-fallback stream server-side and returns one
  cleaned string (or `null` on total failure, never throwing). The request
  sent is a synthetic one-shot transcript (`buildTitleRequestMessages` in
  `src/lib/title/prompt.ts`) — a system instruction + a compact, capped
  transcript of the real conversation — never the real conversation's
  messages verbatim, and nothing from it is persisted.
- Mock provider: `mockGenerateTitle` (`src/lib/title/mock.ts`) picks the
  leading content words out of the user's own messages — same "real offline
  result, no network call" spirit as `mockHumanize`/`mockGeneratePrompt`.
- Either path's raw result goes through `cleanGeneratedTitle`
  (`src/lib/title/clean.ts`) before use — strips wrapping quotes, a "Title:"
  echo, Markdown emphasis, trailing punctuation, and caps length — models
  reliably drift from "reply with the title only" in practice.
- `renameConversation` sets `Conversation.titleManuallySet`, which
  auto-titling checks (both before *and* after its async call resolves, to
  catch a rename that happened while it was in flight) and never overwrites
  — a deliberate rename always wins over a guess. `clearMessages` resets the
  flag along with the title, since clearing starts a fresh topic.

## Canvas

Substantial structured output opens in the **Canvas** workspace (right side on
desktop — the chat resizes, no overlay; full-screen slide-up on mobile) instead
of being dumped into the thread.

- `src/lib/canvas/detect.ts` `planMessageDisplay(message, context?)` runs on
  **completed** assistant messages: it returns the derived `CanvasArtifact[]`
  plus the parts the thread should render, with big artifacts collapsed to a
  `canvas_ref` card. Artifact ids are deterministic (`${messageId}:${partIndex}`)
  so re-derivation is idempotent. Nothing is written back to stored messages.
  `context.humanizerOriginal` (set by `useAssistantArtifacts` when the
  conversation is in Humanizer mode) makes the whole answer one `humanizer`
  artifact instead.
- `useAssistantArtifacts` (in `src/components/canvas/`) registers artifacts in
  `canvas-store` and auto-opens Canvas **once**, only on a live streaming→complete
  transition — never when reopening an old conversation. Manual open is the
  `CanvasReference` card or the top-bar toggle.
- Artifact types: `code` · `html` (sandboxed `<iframe sandbox>`, no scripts) ·
  `table` (filter + CSV export) · `report` (Markdown document) · `image` ·
  `humanizer` (humanized text + word-level diff + keyword check + readability).
  Add a type: extend `CanvasArtifactType`, add a `*-canvas.tsx` view, wire it in
  `canvas-content.tsx` + the detector.
- Image generation is capability-gated (`/api/ai/status` `imageGeneration`,
  driven by `image: true` on a model in `NVIDIA_MODELS`) — never faked.

### Humanizer mode

`humanizer` is a mutually-exclusive composer mode (like Search / Code). When
active, `conversation-store` prepends `HUMANIZER_SYSTEM_PROMPT` as a
non-persisted system message (`buildHumanizerMessages`) and the request rides the
normal provider + router path (category `humanize`, routed to `slime-general`
(the flagship generalist) first — satisfying the Humanizer's structural rules
is an instruction-following problem more than a style-match one, and
`slime-humanizer` (`mistralai/mistral-nemotron`, originally tried first for
its more natural, less stiffly-formal style) did not reliably apply them in
practice, so it is now the second-choice fallback rather than the primary;
mock provider uses the offline `mockHumanize` heuristic). The `humanize`
category also gets a sampling override (`CATEGORY_SAMPLING` in
`src/config/ai-router.ts`: higher temperature + a frequency/presence
penalty) — a low-temperature, no-penalty default produces exactly the
low-perplexity, repetitive token pattern that reads (to a human or an
AI-content detector) as machine-written, so this is the one category where
the provider default is wrong. Every other category keeps the plain
default. On completion the answer becomes one `humanizer` Canvas artifact:
`src/lib/humanizer/` computes the word-level diff (`diffWords` — LCS over
"word + trailing space" tokens, so every highlight is a real edit),
preserved-keyword check, first-person-plural ("we"/"our"/"us") voice check,
and Flesch readability. The stored user message keeps the raw paste — that's
the diff baseline.

### Prompt Generator mode

`prompt_generator` is a mutually-exclusive composer mode (like Search / Code).
When active, `conversation-store` prepends `PROMPT_GENERATOR_SYSTEM_PROMPT` as
a non-persisted system message (`buildPromptGeneratorMessages`) and the
request rides the normal provider + router path (category `structured`; mock
provider uses the offline `mockGeneratePrompt` heuristic in
`src/lib/prompt-generator/`). It turns a rough idea, typed in the user's own
words, into a single ready-to-use AI prompt (Role / Context / Task /
Constraints / Output format in Markdown) — no new Canvas artifact type, the
answer is just new text and goes through the generic Report detection in
`src/lib/canvas/detect.ts` like any other structured answer.

### Local dev tools

- `node scripts/fake-nvidia.mjs` — a fake NVIDIA endpoint (`:9099`) that can
  return every failure mode by `model` name.
- `node scripts/test-router.mjs` — drives the router through all scenarios
  (needs `next build` + the fake endpoint running).

## Voice (speech-to-text / text-to-speech)

Both ride the browser's built-in Web Speech API — no server round-trip, no
model call, works offline like the rest of local-first Slime AI. Each is its
own Zustand store that detects support at runtime (`detectSupport()`, called
once on mount) and every caller hides its button entirely when unsupported
rather than showing it disabled:

- **Text-to-speech** (`src/stores/speech-store.ts`, `useSpeechStore`) — the
  "read aloud" button on assistant messages (`MessageActions`), via
  `window.speechSynthesis`. Broadly supported across modern browsers. An
  utterance with no `lang`/`voice` set falls back to the browser's default
  (usually English) regardless of the text's actual script, which for
  non-Latin text either mispronounces badly or produces no audio at all —
  `speak()` detects the dominant script (`src/lib/speech/detect-lang.ts`,
  `detectSpeechLang` — Unicode script ranges, e.g. Tamil, Devanagari, Han,
  not statistical language ID) and picks a matching installed voice
  (`src/lib/speech/select-voice.ts`, `pickVoice` — ranks by a
  "Natural"/"Enhanced"/"Online" name hint and non-local-service as quality
  signals). Voice/rate/pitch are user-configurable in Settings
  (`src/components/settings/voice-section.tsx`), persisted
  (`localStorage["slime-speech"]`). No installed voice for the detected
  language is a real, honest device/OS gap (no Tamil, etc. voice data
  installed) — surfaced as `speechStore.error`, not silently swallowed; the
  Web Speech API has no emotional-expression control at all regardless of
  voice choice, so that honest limit is stated in the Settings copy rather
  than oversold. What *is* in `speak()`'s own control: never read raw
  Markdown syntax aloud ("asterisk asterisk bold asterisk asterisk", "pound
  pound heading", a literal pipe-delimited table row). `src/lib/speech/
  to-speech-text.ts`'s `toSpeechText(message)` — used for this and for the
  voice-call overlay's spoken reply, NOT for copy-to-clipboard
  (`messageToPlainText`, which correctly keeps raw Markdown) — strips
  emphasis/heading/list/blockquote/hr markers, reads link text instead of
  the URL, reads a Markdown table's cells comma-separated instead of its
  pipe syntax, and announces fenced/structured code ("Code block.") instead
  of reading source character-by-character.

  `useSpeechStore`'s `engine` picks which of two *playback* engines actually
  speaks — both still browser-only, no server round-trip either way:
  - `"browser"` (default) — the flow described above.
  - `"piper"` (opt-in, Settings → Voice) — a real open-source neural TTS
    engine (`@mintplex-labs/piper-tts-web`, MIT; Rhasspy's Piper voice
    models, also MIT) running in-browser via WebAssembly/ONNX Runtime
    (`src/lib/speech/piper.ts`). Genuinely smoother than most OS default
    voices, still free, but the published voice set has **no Tamil, Hindi,
    or most other Indic languages** — `PIPER_LANGUAGE_CODES` documents
    exactly which languages it covers. `speak()` only actually routes to
    Piper when the configured `piperVoiceId`'s own language matches the
    text's detected language (`piperVoiceLang(...) === detected primary
    subtag`); anything else transparently falls back to the `"browser"`
    engine, same as if Piper were off — so this is additive, never a
    regression for a language Piper doesn't cover. First use of a given
    voice downloads its model (tens of MB) from Hugging Face and caches it
    in the Origin Private File System; `piperDownloadProgress` tracks that
    for the UI. Always `await import("@mintplex-labs/piper-tts-web")`
    (lazy, inside `loadPiper()`), never a static top-level import — its own
    README says plainly it "will not work with NodeJS", and the package
    (plus its `onnxruntime-web` peer dependency) is a meaningfully sized
    chunk that users who stick with the free default engine should never
    have to download.
  - **Turbopack build note**: `@mintplex-labs/piper-tts-web` bundles an
    Emscripten runtime whose Node-target branch does
    `require("fs")`/`require("path")` inside a `typeof process === "object"`
    runtime guard that's false in the browser — but Turbopack still
    resolves those `require()` calls textually at build time regardless of
    the guard around them. `next.config.ts`'s `turbopack.resolveAlias`
    points both at `src/lib/shims/empty-node-module.ts` (an empty stub) so
    the build resolves; neither is ever actually called at runtime. Without
    this, `next build` fails outright the moment anything imports
    `piper.ts`, even via a dynamic `import()`.
- **Speech-to-text** (`src/stores/dictation-store.ts`, `useDictationStore`) —
  the mic button in the composer, via `window.SpeechRecognition` /
  `webkitSpeechRecognition` (ambient types in
  `src/types/speech-recognition.d.ts` — not part of TypeScript's bundled DOM
  lib, no W3C standard yet either). Narrower support than synthesis: Chromium
  and Safari only, not Firefox; needs a secure context and a microphone
  permission grant; Chrome's implementation calls out to a Google speech
  service, so it also needs real network access to actually transcribe, not
  just mic access. `Composer` reconstructs the field from "text already
  there" + "final chunks heard so far" on every result (interim included),
  rather than appending, so an interim result firming up doesn't duplicate.

Neither is a routed-model capability — no `TaskCategory`, no entry in
`models.ts`, nothing in `/api/ai/status`. If a real NVIDIA
speech-to-text/text-to-speech NIM is ever wired in, `speak`/`stop` and
`start`/`stop` are exactly the surface a server-streamed-audio
implementation would slot behind; the message/composer UI wouldn't need to
change.

### Voice conversation mode (hands-free)

The composer's second voice button ("Start voice conversation", distinct
from the plain dictate-into-the-box mic — both use the same underlying
`dictation-store` session, so starting one aborts the other) opens
`VoiceCallOverlay` (`src/components/chat/voice-call-overlay.tsx`): a
full-screen loop of listen → auto-send on a ~1.3s pause (no typing, no Send
tap) → speak the reply aloud → listen again, built entirely on the
speech-to-text/text-to-speech stores above plus the normal `sendMessage`
path — still no new provider, no server change.

- `src/stores/voice-call-store.ts` holds only `open`/`conversationId`,
  global rather than page-local, so a call started from the welcome screen
  (no conversation yet) survives the client-side navigation to
  `/chat/[id]` that creating the first conversation triggers.
  `VoiceCallOverlay` is mounted once in `workspace-shell.tsx`, gated on
  `open`, and owns the rest of the state machine (phase, live transcript
  preview, error/retry) itself.
- Every `setState` call in the overlay lives inside a plain, separately-
  defined function (`beginListening`, `commitTurn`, `enterError`,
  `enterSpeaking`), never written inline in a `useEffect` body — React
  Compiler's lint rules flag a bare `setX(...)` statement directly inside an
  effect as a cascading-render risk. `handlersRef` (refreshed in a no-deps
  effect, never written during render) hands async callbacks — a
  `setTimeout`, a dictation chunk, another effect — a way to call the
  *latest* version without listing these every-render-new functions in a
  dependency array, which would make an effect depending on them fire on
  every unrelated render.
- Tapping the mascot while it's speaking interrupts playback (`speechStop`)
  and resumes listening immediately — the same transition the normal
  "speech ended naturally" path uses, not special-cased.

## Environment

Copy `.env.example` → `.env.local`. `NVIDIA_API_KEY` enables the NVIDIA models;
without it the built-in mock provider is used.

## Commands

- `npm run dev` — Turbopack dev server (`.next/dev`)
- `npm run build` — production build
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint (React Compiler rules are on)
