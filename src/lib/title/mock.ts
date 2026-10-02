import type { Message } from "@/types/chat";

/**
 * Offline heuristic used only by the built-in mock provider (no
 * `NVIDIA_API_KEY`/`GROQ_API_KEY`). Picks the leading content words out of
 * the conversation so far — deliberately simple, same spirit as
 * `mockHumanize`/`mockGeneratePrompt`, so auto-titling has a real offline
 * result without a network call. When a real model is configured, the
 * routed model writes the title instead (see `TITLE_SYSTEM_PROMPT`).
 */

const LEADING_STOPWORDS = new Set([
  "a",
  "an",
  "the",
  "please",
  "can",
  "could",
  "would",
  "will",
  "i",
  "im",
  "you",
  "hi",
  "hey",
  "hello",
  "so",
  "ok",
  "okay",
  "just",
]);

function messageText(m: Message): string {
  return m.parts
    .map((p) => {
      if (p.type === "text") return p.text;
      if (p.type === "code") return p.code;
      if (p.type === "table") return p.markdown;
      return "";
    })
    .join(" ")
    .trim();
}

export function mockGenerateTitle(messages: Message[]): string {
  const text = messages
    .filter((m) => m.role === "user")
    .map(messageText)
    .join(" ");

  const words = text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  while (words.length > 1 && LEADING_STOPWORDS.has(words[0].toLowerCase())) {
    words.shift();
  }

  const picked = words.slice(0, 6).join(" ");
  if (!picked) return "New conversation";
  return picked.charAt(0).toUpperCase() + picked.slice(1);
}
