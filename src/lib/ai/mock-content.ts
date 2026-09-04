import type { MessagePart, ToolId } from "@/types/chat";
import { mockHumanize } from "@/lib/humanizer";

const LOREM = [
  "Here's a structured take on that. I've broken the response into the parts that matter most so you can scan it quickly.",
  "Based on the context available in this workspace, the analysis points to a few clear themes worth acting on.",
  "Good question — let me walk through it step by step and flag the trade-offs as we go.",
];

const CODE_SAMPLE = `import { useEffect, useRef, useState } from "react";

export function useReconnectingSocket(url: string) {
  const socketRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<"connecting" | "open" | "closed">(
    "connecting",
  );

  useEffect(() => {
    let retry = 0;
    let cancelled = false;

    function connect() {
      const socket = new WebSocket(url);
      socketRef.current = socket;
      socket.onopen = () => {
        retry = 0;
        setStatus("open");
      };
      socket.onclose = () => {
        setStatus("closed");
        if (cancelled) return;
        retry += 1;
        setTimeout(connect, Math.min(1000 * 2 ** retry, 15000));
      };
    }

    connect();
    return () => {
      cancelled = true;
      socketRef.current?.close();
    };
  }, [url]);

  return { socket: socketRef, status };
}`;

const HTML_SAMPLE = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Slime AI — Launch</title>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; background: #f7f9fb; color: #191c1e; }
      .hero { max-width: 640px; margin: 0 auto; padding: 64px 24px; text-align: center; }
      h1 { font-size: 2rem; letter-spacing: -0.02em; }
      .cta { display: inline-block; margin-top: 16px; padding: 12px 24px;
             border-radius: 9999px; background: #630ed4; color: #fff; text-decoration: none; }
    </style>
  </head>
  <body>
    <div class="hero">
      <h1>Meet Slime AI</h1>
      <p>One premium workspace for chat, research, code and canvas.</p>
      <a class="cta" href="#">Get started</a>
    </div>
  </body>
</html>`;

const REPORT_SAMPLE = `# Q3 Engagement Report

## Overview

Overall engagement climbed in Q3, driven by stronger weekday activation and a healthier return rate among accounts created in the previous two quarters. The headline numbers are up across every segment except Professional Services, which is flagged for review below.

## Key trends

- **Weekly active accounts** rose 18% quarter over quarter.
- **Session depth** (actions per session) improved from 6.2 to 7.4.
- **Return rate** at day 7 held steady at 41%, and day 30 improved to 22%.

## Segment breakdown

| Segment | Q3 Amount (USD) | YoY Growth | Status |
| --- | --- | --- | --- |
| Enterprise Licensing | $4,250,000 | +24% | On Target |
| API Usage (Metered) | $1,820,000 | +41% | Exceeding |
| Professional Services | $850,000 | -5% | Review Needed |
| Hardware Sales | $320,000 | +2% | Stable |

## Recommendation

Double down on the metered API motion, where growth and margin are both strong, and open a focused review of Professional Services delivery costs before the next planning cycle.`;

const TABLE_SAMPLE = `| Segment | Q3 Amount (USD) | YoY Growth | Status |
| --- | --- | --- | --- |
| Enterprise Licensing | $4,250,000 | +24% | On Target |
| API Usage (Metered) | $1,820,000 | +41% | Exceeding |
| Professional Services | $850,000 | -5% | Review Needed |
| Hardware Sales | $320,000 | +2% | Stable |
| **Total** | **$7,240,000** | **+18%** | — |`;

function pick<T>(list: T[], seed: number): T {
  return list[Math.abs(seed) % list.length];
}

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return h;
}

/**
 * Deterministically builds a plausible multi-part assistant response for a given
 * prompt + toolset. Swapped for a real provider stream later.
 */
export function buildMockResponse(prompt: string, tools: ToolId[]): MessagePart[] {
  // Humanizer mode: the offline provider just returns a heuristically rewritten
  // version of the pasted text — the diff, keywords and report are derived from
  // the (original, rewrite) pair in Canvas.
  if (tools.includes("humanizer")) {
    return [{ type: "text", text: mockHumanize(prompt) || prompt }];
  }

  const seed = hash(prompt);
  const wantsHtml = /\bhtml|landing page|web ?page|markup\b/i.test(prompt);
  const wantsReport =
    /\breport|write[- ]?up|analysis|breakdown|summary of\b/i.test(prompt) &&
    !tools.includes("code");
  const wantsCode =
    !wantsHtml &&
    (tools.includes("code") || /\bcode|hook|function|script|react\b/i.test(prompt));
  const wantsTable =
    !wantsReport &&
    (tools.includes("file_analysis") ||
      /\banaly|metric|revenue|breakdown|table|trend\b/i.test(prompt));
  const wantsSearch = tools.includes("web_search") || tools.includes("research");

  const parts: MessagePart[] = [];

  if (tools.includes("research")) {
    parts.push({
      type: "tool_call",
      tool: "research",
      label: "Deep research",
      status: "done",
      detail: "Reviewed 12 sources across 3 rounds",
    });
  } else if (tools.includes("web_search")) {
    parts.push({
      type: "tool_call",
      tool: "web_search",
      label: "Web search",
      status: "done",
      detail: "4 results",
    });
  }

  parts.push({ type: "text", text: pick(LOREM, seed) });

  if (wantsReport) {
    parts.push({ type: "text", text: REPORT_SAMPLE });
  }

  if (wantsHtml) {
    parts.push({
      type: "text",
      text: "Here's a self-contained page you can preview in Canvas:",
    });
    parts.push({ type: "code", language: "html", filename: "index.html", code: HTML_SAMPLE });
  }

  if (wantsCode) {
    parts.push({
      type: "text",
      text: "Here's an implementation you can drop in:",
    });
    parts.push({
      type: "code",
      language: "tsx",
      filename: "use-reconnecting-socket.tsx",
      code: CODE_SAMPLE,
    });
  }

  if (wantsTable) {
    parts.push({
      type: "text",
      text: "The summarised numbers:",
    });
    parts.push({ type: "table", markdown: TABLE_SAMPLE });
  }

  if (tools.includes("image_gen")) {
    parts.push({
      type: "image",
      url: "",
      alt: "Generated placeholder image",
      prompt,
    });
  }

  if (wantsSearch) {
    parts.push({
      type: "citation_group",
      citations: [
        { id: "1", label: "q3_metrics_raw.csv", icon: "description" },
        { id: "2", label: "Q3_Financial_Brief.pdf", icon: "analytics" },
      ],
    });
  }

  return parts;
}

export function mockTitleFromPrompt(prompt: string): string {
  const clean = prompt.trim().replace(/\s+/g, " ");
  if (clean.length <= 40) return clean || "New conversation";
  return `${clean.slice(0, 38)}…`;
}
