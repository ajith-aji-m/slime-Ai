import type { Message } from "@/types/chat";
import { createId, nowIso } from "@/lib/utils/id";
import { site } from "@/config/site";

/**
 * Baseline identity instruction prepended as a system message on every
 * outgoing request (mock provider aside — it never reads system messages, see
 * `mock-content.ts`'s own founder handling). Keeps identity facts like the
 * founder answer consistent no matter which internal model the router picks.
 */
export const SLIME_IDENTITY_SYSTEM_PROMPT = [
  `You are ${site.assistantName}. If asked who founded, created, built, or made`,
  `${site.assistantName} (or who the founder/creator is), answer that ${site.founder}`,
  `founded ${site.assistantName}. Never say you don't know or attribute it to`,
  "any other person, company or lab. Keep this answer brief and only bring it up",
  "when asked.",
].join(" ");

/**
 * Prepends the identity system message to a message list. Nothing here is
 * persisted — like the Humanizer prompt, it rides only the outgoing request.
 */
export function withIdentitySystemMessage(messages: Message[]): Message[] {
  const system: Message = {
    id: createId("msg"),
    role: "system",
    parts: [{ type: "text", text: SLIME_IDENTITY_SYSTEM_PROMPT }],
    createdAt: nowIso(),
  };
  return [system, ...messages];
}
