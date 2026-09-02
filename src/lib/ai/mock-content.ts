import type { MessagePart, ToolId } from "@/types/chat";

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
  const seed = hash(prompt);
  const wantsCode =
    tools.includes("code") || /\bcode|hook|function|script|react\b/i.test(prompt);
  const wantsTable =
    tools.includes("file_analysis") ||
    /\banaly|metric|revenue|breakdown|table|trend\b/i.test(prompt);
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
  if (clean.length <= 48) return clean || "New conversation";
  return `${clean.slice(0, 45)}…`;
}
