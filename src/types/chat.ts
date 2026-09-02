/** Core conversation domain model. Provider-agnostic and storage-agnostic. */

export type MessageRole = "user" | "assistant" | "system";

export type ToolId =
  | "web_search"
  | "code"
  | "image_gen"
  | "research"
  | "file_analysis";

/** A message is an ordered list of typed parts so tool output slots in cleanly. */
export type MessagePart =
  | { type: "text"; text: string }
  | { type: "code"; language: string; code: string; filename?: string }
  | { type: "table"; markdown: string }
  | {
      type: "tool_call";
      tool: ToolId;
      label: string;
      status: "running" | "done" | "error";
      detail?: string;
    }
  | { type: "citation_group"; citations: Citation[] }
  | { type: "image"; url: string; alt: string; prompt?: string };

export interface Citation {
  id: string;
  label: string;
  icon?: string;
  href?: string;
}

export interface TokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

export interface Attachment {
  id: string;
  name: string;
  /** bytes */
  size: number;
  mimeType: string;
  /** object URL or data URL — local only for now */
  url?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  parts: MessagePart[];
  /** ISO timestamp */
  createdAt: string;
  /** model id that produced an assistant message */
  modelId?: string;
  attachments?: Attachment[];
  /** streaming lifecycle for assistant messages */
  status?: "streaming" | "complete" | "error" | "stopped";
  /** token usage reported by the provider, when available */
  usage?: TokenUsage;
  /** set when the user edited their own message */
  editedAt?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  modelId: string;
  /** enabled tools for this conversation */
  tools: ToolId[];
  messages: Message[];
  projectId?: string;
  pinned?: boolean;
}

/** Lightweight list projection — avoids loading every message for the sidebar. */
export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  pinned?: boolean;
  projectId?: string;
}
