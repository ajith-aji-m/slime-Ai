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

The theme is a single deep-ocean blue "liquid glass" surface (near-white text,
cyan/sky accents, three glass panels floating over an ambient gradient with a
`p-3.5`/`gap-3.5` gutter). It lives in `:root` — there is no separate light
theme any more. Per-mode accent shifts (Search cyan · Code teal · Research amber
· Image Gen magenta) are `[data-mode]` blocks that move only the accent family,
the `--sl-slime-*` mascot gradient and the ambient glow, and interpolate via
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
  ├─ mode "mock"   → mockChatProvider   (browser, offline)
  └─ mode "nvidia" → httpChatProvider   (browser) → POST /api/chat (server)
                       → src/lib/ai/server/router.ts  (Internal AI Router)
                          classify task → pick NVIDIA model → stream
                          → recoverable failure? fall back to next model (cap 3)
                          → NDJSON StreamChunk
```

- Client never imports a provider SDK, an API key, or a model name.
- `GET /api/ai/status` → `{ mode, imageGeneration }` (non-secret capability flags
  only — never model or provider names). `ai-status-store` consumes it.
- Model ids live ONLY in `src/config/models.ts` + the `NVIDIA_MODELS` env var.
- Routing policy (category → ordered roles, attempt cap) is `src/config/ai-router.ts`.
- Server code in `src/lib/ai/server/*` is `import "server-only"`.
- Dev-only routing logs: `[ai-router] …` (role ids, categories, reasons, timings — never secrets). Silent in production.

### Add the next provider

1. `src/lib/ai/server/<name>.ts` — `stream<Name>Model({ upstreamId, messages, signal })`
   (reuse `streamOpenAICompatible` if OpenAI-shaped).
2. Wire it into `src/lib/ai/server/router.ts` (or add a provider dimension there).
3. Add its models to `src/config/models.ts`.
4. Document env vars in `.env.example` + `src/lib/ai/server/env.ts`.

Nothing in the UI changes.

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
normal provider + router path (category `general`; mock provider uses the
offline `mockHumanize` heuristic). On completion the answer becomes one
`humanizer` Canvas artifact: `src/lib/humanizer/` computes the word-level diff
(`diffWords` — LCS over "word + trailing space" tokens, so every highlight is a
real edit), preserved-keyword check, and Flesch readability. The stored user
message keeps the raw paste — that's the diff baseline.

### Local dev tools

- `node scripts/fake-nvidia.mjs` — a fake NVIDIA endpoint (`:9099`) that can
  return every failure mode by `model` name.
- `node scripts/test-router.mjs` — drives the router through all scenarios
  (needs `next build` + the fake endpoint running).

## Environment

Copy `.env.example` → `.env.local`. `NVIDIA_API_KEY` enables the NVIDIA models;
without it the built-in mock provider is used.

## Commands

- `npm run dev` — Turbopack dev server (`.next/dev`)
- `npm run build` — production build
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint (React Compiler rules are on)
