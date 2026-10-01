import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      // @mintplex-labs/piper-tts-web bundles an Emscripten runtime whose
      // Node-target branch does `require("fs")`/`require("path")` inside a
      // runtime `typeof process === "object"` guard — a check that's false
      // in the browser, so that code never actually executes. Turbopack
      // still resolves the `require()` call textually at build time
      // regardless, so these need to point at *something* real; see
      // `src/lib/shims/empty-node-module.ts`.
      fs: "./src/lib/shims/empty-node-module.ts",
      path: "./src/lib/shims/empty-node-module.ts",
    },
  },
};

export default nextConfig;
