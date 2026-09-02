# Slime AI

Premium multi-model AI workstation. Next.js 16 (App Router) · TypeScript · Tailwind v4 · Zustand.
Local-first: chat history lives in the browser (IndexedDB). No real AI APIs yet — a mock
streaming provider answers.

## Source of truth for design

`stitch_lumina_ai_workspace/` holds the original Stitch export (do not delete):

- `aetheric_intelligence_light/DESIGN.md` — the shipped light design system (tokens in `src/app/globals.css`)
- `aetheric_intelligence/DESIGN.md` — dark palette, wired behind `[data-theme="dark"]` but not exposed
- `aetheric_workstation_*/` — the 3 reference screens (welcome, conversation, mobile chat) + PNGs

Preserve this visual language. Don't introduce a generic UI or a dark theme.

## Architecture

| Path | Purpose |
| --- | --- |
| `src/app/(workspace)/` | Authenticated shell routes (sidebar + main + Intelligence panel) |
| `src/app/login`, `src/app/get-started` | Pre-workspace flows (mock auth, onboarding) |
| `src/components/ui/` | Design-system primitives |
| `src/components/layout/` | Shell: sidebar, top bar, drawers, page wrappers |
| `src/components/chat/` | Composer, message list, message parts, markdown/code/table |
| `src/components/context-panel/` | Files / Sources / Tools / Activity tabs |
| `src/lib/ai/` | `ChatProvider` interface + `mockChatProvider` (registry keyed by providerId) |
| `src/lib/storage/` | `ConversationStore` interface + IndexedDB adapter + retention job |
| `src/stores/` | Zustand: conversations, ui, model, settings |
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
- `GET /api/ai/status` → `{ mode }` only. `ai-status-store` consumes it.
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
