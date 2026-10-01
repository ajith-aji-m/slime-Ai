/**
 * Turbopack build-time stub for Node core modules (`fs`, `path`) that
 * `@mintplex-labs/piper-tts-web`'s bundled Emscripten runtime `require()`s
 * inside a `typeof process === "object"` guard meant for its (unused here)
 * Node build target. That branch never actually runs in a browser — Piper
 * only ever executes here client-side — but Turbopack still resolves the
 * `require()` call textually at build time regardless of the runtime guard
 * around it, so it needs *something* real to resolve to. An empty module
 * satisfies that without ever being called into. See `next.config.ts`'s
 * `turbopack.resolveAlias`.
 */
export {};
