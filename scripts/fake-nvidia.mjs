/**
 * Fake NVIDIA NIM endpoint for exercising the internal router locally.
 * Behaviour is chosen by the `model` field of the request:
 *
 *   test/ok           → normal SSE stream + usage
 *   test/recoverable  → 503 (temporary upstream failure)
 *   test/ratelimit    → 429
 *   test/permanent    → 401 (invalid key style)
 *   test/badrequest   → 400
 *   test/timeout      → never responds
 *   test/midstream    → streams one chunk, then kills the socket
 *   test/empty        → SSE that sends [DONE] with no content
 *
 * Run:  node scripts/fake-nvidia.mjs   (listens on :9099, path /v1/...)
 */
import { createServer } from "node:http";

const PORT = Number(process.env.FAKE_NVIDIA_PORT ?? 9099);

function sse(res, text) {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const words = text.split(" ");
  let i = 0;
  const timer = setInterval(() => {
    if (i < words.length) {
      const delta = i === 0 ? words[i] : ` ${words[i]}`;
      res.write(
        `data: ${JSON.stringify({ choices: [{ delta: { content: delta } }] })}\n\n`,
      );
      i += 1;
    } else {
      res.write(
        `data: ${JSON.stringify({
          choices: [{ delta: {}, finish_reason: "stop" }],
          usage: { prompt_tokens: 11, completion_tokens: words.length, total_tokens: 11 + words.length },
        })}\n\n`,
      );
      res.write("data: [DONE]\n\n");
      clearInterval(timer);
      res.end();
    }
  }, 15);
}

/** Close the socket after error responses so a reused keep-alive connection
 *  can't poison the fallback attempt's stream. */
function errJson(res, status, detail) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    Connection: "close",
  });
  res.end(JSON.stringify({ status, detail }));
}

const server = createServer((req, res) => {
  if (!req.url?.startsWith("/v1/chat/completions")) {
    res.writeHead(404).end();
    return;
  }

  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    let model = "";
    try {
      model = JSON.parse(body).model ?? "";
    } catch {
      /* ignore */
    }
    const auth = req.headers.authorization ?? "";
    console.log(`[fake-nvidia] model=${model} auth=${auth.slice(0, 14)}…`);

    if (auth.includes("test-bad-key")) {
      errJson(res, 401, "Authorization failed");
      return;
    }

    switch (model) {
      case "test/recoverable":
        errJson(res, 503, "temporary upstream failure");
        return;
      case "test/ratelimit":
        errJson(res, 429, "rate limit exceeded");
        return;
      case "test/permanent":
        errJson(res, 401, "invalid api key");
        return;
      case "test/badrequest":
        errJson(res, 400, "malformed request");
        return;
      case "test/timeout":
        return; // never respond
      case "test/empty":
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      case "test/midstream": {
        // chunked SSE, then an abrupt socket kill mid-stream (no [DONE]) —
        // undici surfaces this as a network/stream error, like a real drop.
        res.writeHead(200, { "Content-Type": "text/event-stream" });
        res.write(
          `data: ${JSON.stringify({ choices: [{ delta: { content: "Partial answer that trails" } }] })}\n\n`,
        );
        setTimeout(() => req.socket.destroy(), 40);
        return;
      }
      default:
        sse(res, "Hello from the fake NVIDIA endpoint. This is a routed streaming response.");
    }
  });
});

server.listen(PORT, () => {
  console.log(`[fake-nvidia] listening on http://localhost:${PORT}/v1`);
});
