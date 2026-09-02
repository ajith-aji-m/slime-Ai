import type { Message, MessagePart, TokenUsage, ToolId } from "./chat";
import type { TaskCategory } from "@/config/ai-router";

/**
 * Minimal provider self-description. Slime AI no longer exposes a model picker,
 * so `models` is informational only (usually empty for real providers — the
 * internal router owns model choice).
 */
export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  kind: string;
  status: "connected" | "available" | "coming-soon";
}

/** Streaming chunk emitted by a provider while producing a response. */
export type StreamChunk =
  | { type: "part-start"; part: MessagePart }
  | { type: "text-delta"; text: string }
  | { type: "part-end" }
  | { type: "usage"; usage: TokenUsage }
  /** transient internal-router activity, shown as a subtle status line */
  | { type: "status"; label: string }
  | { type: "error"; message: string; code?: string; recoverable?: boolean }
  | { type: "done"; meta?: GenerationMeta };

/** Non-secret routing metadata kept for local debugging only. */
export interface GenerationMeta {
  /** internal role id, e.g. "slime-reasoning" — never an upstream id */
  finalRole?: string;
  category?: TaskCategory;
  attempts?: number;
}

export interface ChatRequest {
  messages: Message[];
  tools: ToolId[];
  /** optional task hint; the router classifies the request if absent */
  taskHint?: TaskCategory;
  signal?: AbortSignal;
}

/**
 * The one interface every backend implements — mock and server-routed alike.
 * Callers never branch on provider type.
 */
export interface ChatProvider {
  readonly info: ProviderInfo;
  readonly models: ModelInfo[];
  streamChat(request: ChatRequest): AsyncIterable<StreamChunk>;
}
