import "server-only";
import type { Message, ToolId } from "@/types/chat";
import { LONG_CONTEXT_CHARS, type TaskCategory } from "@/config/ai-router";

const PATTERNS: { category: TaskCategory; re: RegExp }[] = [
  {
    category: "reasoning",
    re: /\b(reason|reasoning|step[- ]by[- ]step|think through|prove|proof|derive|logic(al)?|deduce|why does|explain why|trade[- ]?offs?|chain of thought)\b/i,
  },
  {
    category: "coding",
    re: /\b(code|coding|function|class|bug|debug|refactor|implement|typescript|javascript|python|rust|golang|sql|regex|api endpoint|unit test|stack trace|compile|npm|react hook)\b|```/i,
  },
  {
    category: "research",
    re: /\b(research|sources?|cite|citation|literature|survey|state of the art|compare .* (papers|studies|vendors)|market report)\b/i,
  },
  {
    category: "structured",
    re: /\b(json|yaml|csv|xml|schema|table of|as a table|bullet list|structured (output|format)|format (this|the response) as|return (a|an) (object|array))\b/i,
  },
];

/** Rough char count of everything the model will receive. */
export function estimateInputChars(messages: Message[]): number {
  let total = 0;
  for (const m of messages) {
    for (const p of m.parts) {
      if (p.type === "text") total += p.text.length;
      else if (p.type === "code") total += p.code.length;
      else if (p.type === "table") total += p.markdown.length;
    }
  }
  return total;
}

/**
 * Best-effort task classification from the conversation. Cheap heuristics only —
 * the fallback chain covers a wrong guess. The user never sees the result.
 */
export function classifyTask(
  messages: Message[],
  tools: ToolId[],
): TaskCategory {
  if (tools.includes("research")) return "research";

  const chars = estimateInputChars(messages);
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const text =
    lastUser?.parts.map((p) => (p.type === "text" ? p.text : "")).join(" ") ??
    "";

  for (const { category, re } of PATTERNS) {
    if (re.test(text)) {
      // a big coding/analysis payload is still long-context first
      if (chars > LONG_CONTEXT_CHARS && category !== "reasoning") {
        return "long_context";
      }
      return category;
    }
  }

  if (chars > LONG_CONTEXT_CHARS) return "long_context";
  return "general";
}
