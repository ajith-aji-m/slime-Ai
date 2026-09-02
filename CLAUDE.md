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

## Connecting a real provider later

Implement `ChatProvider` (`src/types/provider.ts`), register it in `src/lib/ai/index.ts`
under its `providerId`, and flip `available: true` on its models in `src/config/providers.ts`.
Nothing in the UI changes.

## Commands

- `npm run dev` — Turbopack dev server (`.next/dev`)
- `npm run build` — production build
- `npx tsc --noEmit` — typecheck
- `npx eslint .` — lint (React Compiler rules are on)
