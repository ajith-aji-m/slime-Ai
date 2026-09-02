/**
 * Drives the internal router through every failure mode against
 * scripts/fake-nvidia.mjs. Requires `next build` first.
 *
 *   node scripts/fake-nvidia.mjs &
 *   node scripts/test-router.mjs
 */
import { spawn, execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

function killTree(pid) {
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(-pid, "SIGKILL");
    }
  } catch {
    /* already gone */
  }
}

const BASE = "http://localhost:3000";
const NEXT_BIN = "node_modules/next/dist/bin/next";
const COMMON = {
  NVIDIA_API_KEY: "test-good-key",
  NVIDIA_BASE_URL: "http://localhost:9099/v1",
  AI_REQUEST_TIMEOUT_MS: "1500",
  AI_MAX_FALLBACKS: "3",
  NODE_ENV: "production",
};

const ok = { id: "slime-versatile", upstreamId: "test/ok", strengths: ["general"], order: 2 };
const fast = { id: "slime-fast", upstreamId: "test/ok", strengths: ["general"], order: 3 };
const recov = (id, order) => ({ id, upstreamId: "test/recoverable", strengths: ["general"], order });

const SCENARIOS = [
  { name: "1. normal success", models: [{ id: "slime-general", upstreamId: "test/ok", strengths: ["general"], order: 1 }], prompt: "Say hello." },
  { name: "2. recoverable error -> fallback", models: [{ id: "slime-general", upstreamId: "test/recoverable", strengths: ["general"], order: 1 }, ok, fast], prompt: "Describe the system." },
  { name: "3. rate limit -> fallback", models: [{ id: "slime-general", upstreamId: "test/ratelimit", strengths: ["general"], order: 1 }, ok, fast], prompt: "What is this." },
  { name: "4. timeout -> fallback", models: [{ id: "slime-general", upstreamId: "test/timeout", strengths: ["general"], order: 1 }, ok, fast], prompt: "Give me a summary." },
  { name: "5. permanent error (no fallback)", models: [{ id: "slime-general", upstreamId: "test/permanent", strengths: ["general"], order: 1 }, ok, fast], prompt: "Explain permanence." },
  { name: "6. malformed request (permanent)", models: [{ id: "slime-general", upstreamId: "test/badrequest", strengths: ["general"], order: 1 }, ok, fast], prompt: "Explain bad requests." },
  { name: "7. midstream failure (preserve partial)", models: [{ id: "slime-general", upstreamId: "test/midstream", strengths: ["general"], order: 1 }, ok, fast], prompt: "Write a paragraph." },
  { name: "8. all recoverable -> exhausted", models: [recov("slime-general", 1), recov("slime-versatile", 2), recov("slime-fast", 3)], prompt: "Try hard." },
  { name: "9. abort mid-stream", models: [{ id: "slime-general", upstreamId: "test/ok", strengths: ["general"], order: 1 }], prompt: "Long answer please.", abortMs: 60 },
];

async function waitReady(timeoutMs = 25000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const r = await fetch(`${BASE}/api/ai/status`, { cache: "no-store" });
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await sleep(300);
  }
  throw new Error("server did not become ready");
}

async function run() {
  for (const sc of SCENARIOS) {
    const proc = spawn(process.execPath, [NEXT_BIN, "start", "-p", "3000"], {
      env: { ...process.env, ...COMMON, NVIDIA_MODELS: JSON.stringify(sc.models) },
      stdio: ["ignore", "ignore", "ignore"],
    });
    try {
      await waitReady();
    } catch (e) {
      console.log(`\n${sc.name}\n  SKIPPED: ${e.message}`);
      killTree(proc.pid);
      await sleep(1000);
      continue;
    }

    const body = {
      messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: sc.prompt }], createdAt: "2026-09-02T00:00:00Z" }],
      tools: [],
    };

    const controller = new AbortController();
    if (sc.abortMs) setTimeout(() => controller.abort(), sc.abortMs);

    let text = "";
    let aborted = false;
    try {
      const res = await fetch(`${BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      text = await res.text();
    } catch (e) {
      if (e.name === "AbortError") aborted = true;
      else text = `FETCH ERROR ${e.message}`;
    }

    const chunks = text.trim().split("\n").filter(Boolean).map((l) => {
      try { return JSON.parse(l); } catch { return { raw: l }; }
    });
    const summary = chunks.map((c) => c.type ?? "raw").join(",");
    const statusLabels = chunks.filter((c) => c.type === "status").map((c) => c.label);
    const errors = chunks.filter((c) => c.type === "error");
    const textOut = chunks.filter((c) => c.type === "text-delta").map((c) => c.text).join("");
    const done = chunks.find((c) => c.type === "done");

    console.log(`\n${sc.name}`);
    if (aborted) console.log("  client aborted the request");
    console.log(`  chunks:  ${summary || "(none)"}`);
    if (statusLabels.length) console.log(`  status:  ${JSON.stringify(statusLabels)}`);
    if (textOut) console.log(`  text:    ${JSON.stringify(textOut.slice(0, 90))}`);
    if (done?.meta) console.log(`  meta:    ${JSON.stringify(done.meta)}`);
    if (errors.length)
      console.log(`  error:   ${errors.map((e) => `${e.code} recoverable=${e.recoverable} :: ${e.message}`).join(" | ")}`);

    killTree(proc.pid);
    await sleep(1200);
  }
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
