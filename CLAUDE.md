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

## AI providers

```
Chat UI → conversation-store → getProviderForModel(modelId)
  ├─ "slime"  → mockChatProvider   (browser, offline mock)
  └─ else     → httpChatProvider   (browser) → POST /api/chat (server)
                  → src/lib/ai/server/registry → NVIDIA (OpenAI-compatible)
```

- Client never imports a provider SDK or an API key. Real calls go through
  `POST /api/chat` (NDJSON stream of `StreamChunk`).
- `GET /api/models` is the live Model Registry (static metadata + runtime
  `available` + `NVIDIA_MODELS` env overrides); `catalogue-store` consumes it.
- Server provider code lives in `src/lib/ai/server/*` and is `import "server-only"`.

### Add the next provider

1. `src/lib/ai/server/<name>.ts` — a `streamChat(request): AsyncGenerator<StreamChunk>`
   (reuse `streamOpenAICompatible` if the API is OpenAI-shaped).
2. Register it in `src/lib/ai/server/registry.ts` (`serverProviders` + `serverModelIndex` + `providerConfigured`).
3. Add its models to `src/config/providers.ts` with `upstreamId`.
4. Document env vars in `.env.example` + `src/lib/ai/server/env.ts`.

Nothing in the UI changes.

## Environment

Copy `.env.example` → `.env.local`. `NVIDIA_API_KEY` enables the NVIDIA models;
without it the built-in mock provider is used.

## Commands

- `npm run dev` — Turbopack dev server (`.next/dev`)
- `npm run build` — production build
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint (React Compiler rules are on)
