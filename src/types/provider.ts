import type { Message, MessagePart, TokenUsage, ToolId } from "./chat";

/** A single model exposed by a provider (Model Registry entry). */
export interface ModelInfo {
  id: string;
  /** provider id that owns this model */
  providerId: string;
  name: string;
  description: string;
  /** short badge, e.g. "Fast", "Reasoning", "Vision" */
  badges: string[];
  contextWindow: number;
  capabilities: ToolId[];
  /** provider supports token streaming for this model */
  streaming: boolean;
  /** provider supports tool/function calling for this model */
  toolCalling: boolean;
  /**
   * false until a real API key / integration is wired. This is the *static*
   * default; the live value comes from `GET /api/models`.
   */
  available: boolean;
  tier: "free" | "pro";
  /** upstream model id sent to the provider API (server maps this) */
  upstreamId?: string;
}

export interface ProviderInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  /** e.g. "OpenAI-compatible", "NVIDIA NIM" */
  kind: string;
  status: "connected" | "available" | "coming-soon";
}

/** Streaming chunk emitted by a provider while producing a response. */
export type StreamChunk =
  | { type: "part-start"; part: MessagePart }
  | { type: "text-delta"; text: string }
  | { type: "part-end" }
  | { type: "usage"; usage: TokenUsage }
  | { type: "error"; message: string; code?: string }
  | { type: "done" };

export interface ChatRequest {
  messages: Message[];
  modelId: string;
  tools: ToolId[];
  signal?: AbortSignal;
}

/**
 * The one interface every backend implements. `MockChatProvider` fulfils it today;
 * an `NvidiaProvider`, `OpenAiCompatibleProvider`, etc. drop in later unchanged.
 */
export interface ChatProvider {
  readonly info: ProviderInfo;
  readonly models: ModelInfo[];
  streamChat(request: ChatRequest): AsyncIterable<StreamChunk>;
}
