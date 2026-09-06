"use client";

import { create } from "zustand";
import type {
  Attachment,
  Conversation,
  ConversationSummary,
  Message,
  MessagePart,
  ToolId,
} from "@/types/chat";
import { conversationStore, runRetention } from "@/lib/storage";
import { getChatProvider } from "@/lib/ai";
import { mockTitleFromPrompt } from "@/lib/ai/mock-content";
import { createId, nowIso } from "@/lib/utils/id";
import { toggleToolInList } from "@/lib/tool-mode";
import { activeModeTool } from "@/config/tools";
import { buildHumanizerMessages } from "@/lib/humanizer";
import { withIdentitySystemMessage } from "@/lib/ai/identity";
import { useMascotStore } from "@/stores/mascot-store";
import {
  MAX_TEXT_ATTACHMENT_BYTES,
  MAX_VISION_IMAGE_BYTES,
  isImageAttachment,
  isTextAttachment,
} from "@/lib/utils/file";

/** Abort controllers for in-flight streams — kept outside React state. */
const streams = new Map<string, AbortController>();

interface SendOptions {
  tools: ToolId[];
  attachments?: Attachment[];
}

export interface ConversationSearchResult {
  id: string;
  title: string;
  updatedAt: string;
  /** short excerpt around the match, or the title itself when only the title matched */
  snippet: string;
}

function messageText(m: Message): string {
  return m.parts
    .map((p) => {
      if (p.type === "text") return p.text;
      if (p.type === "code") return p.code;
      if (p.type === "table") return p.markdown;
      return "";
    })
    .join(" ");
}

/** first ~80 chars around the match, so results read as a real excerpt */
function snippetAround(text: string, query: string): string {
  const lower = text.toLowerCase();
  const at = lower.indexOf(query.toLowerCase());
  if (at === -1) return text.slice(0, 80).trim();
  const start = Math.max(0, at - 30);
  const end = Math.min(text.length, at + query.length + 50);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

interface ConversationState {
  hydrated: boolean;
  summaries: ConversationSummary[];
  conversations: Record<string, Conversation>;
  streamingIds: Set<string>;
  /** transient per-conversation router status, e.g. "Optimizing response…" */
  streamStatus: Record<string, string | undefined>;

  hydrate: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  /** local, client-side search over every stored conversation's title + message text */
  searchConversations: (query: string) => Promise<ConversationSearchResult[]>;
  createConversation: (seed?: Partial<Conversation>) => string;
  sendMessage: (id: string, text: string, options: SendOptions) => Promise<void>;
  stopStreaming: (id: string) => void;
  regenerate: (id: string) => Promise<void>;
  editUserMessage: (id: string, messageId: string, text: string) => Promise<void>;
  renameConversation: (id: string, title: string) => void;
  clearMessages: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  toggleTool: (id: string, tool: ToolId) => void;
}

/**
 * `update()` fires on every streamed token, so an unthrottled `persist()`
 * would hit IndexedDB dozens of times a second while a reply is streaming.
 * Throttle it per-conversation instead: the first call in a window writes
 * immediately (so non-streaming edits still save right away), later calls
 * during that window just update what's pending, and a trailing write
 * flushes the latest state once the window elapses — so storage is never
 * more than `PERSIST_THROTTLE_MS` behind what's on screen. `flushPersist`
 * forces that trailing write immediately, used when a stream ends so
 * storage is caught up the moment streaming stops rather than up to a
 * throttle window later.
 */
const PERSIST_THROTTLE_MS = 300;
const persistTimers = new Map<string, ReturnType<typeof setTimeout>>();
const persistPending = new Map<string, Conversation>();

function persist(conversation: Conversation) {
  const id = conversation.id;
  if (persistTimers.has(id)) {
    persistPending.set(id, conversation);
    return;
  }
  void conversationStore.put(conversation);
  persistTimers.set(
    id,
    setTimeout(() => {
      persistTimers.delete(id);
      const pending = persistPending.get(id);
      if (pending) {
        persistPending.delete(id);
        void conversationStore.put(pending);
      }
    }, PERSIST_THROTTLE_MS),
  );
}

function flushPersist(id: string) {
  const timer = persistTimers.get(id);
  if (timer) clearTimeout(timer);
  persistTimers.delete(id);
  const pending = persistPending.get(id);
  if (pending) {
    persistPending.delete(id);
    void conversationStore.put(pending);
  }
}

/**
 * Attachments are inlined as data URLs for local storage (see
 * `src/lib/utils/file.ts`), which can be megabytes per file — fine for
 * IndexedDB, but sent as JSON to `/api/chat` on every turn (the whole
 * history rides along each time) it can blow past the platform's request
 * body limit and fail the turn. So: strip every attachment's `url` before
 * the request leaves the browser, *except* on the newest message (the one
 * this turn is about) — an image under `MAX_VISION_IMAGE_BYTES` (the
 * server's vision fork, `routeVision` in `src/lib/ai/server/router.ts`, is
 * the only thing that gets to see it) or a text-like file under
 * `MAX_TEXT_ATTACHMENT_BYTES` (inlined as a fenced block — see
 * `attachmentsContent` in `src/lib/ai/server/messages.ts`). Everything else
 * keeps only id/name/size/mimeType, enough for the model to know a file was
 * attached without seeing its contents.
 */
function stripAttachmentData(messages: Message[]): Message[] {
  const lastIndex = messages.length - 1;
  return messages.map((m, index) => {
    if (!m.attachments?.length) return m;
    const isNewestMessage = index === lastIndex;
    return {
      ...m,
      attachments: m.attachments.map((a) => {
        const keep =
          isNewestMessage &&
          ((isImageAttachment(a) && a.size <= MAX_VISION_IMAGE_BYTES) ||
            (isTextAttachment(a) && a.size <= MAX_TEXT_ATTACHMENT_BYTES));
        if (keep) return a;
        const { id, name, size, mimeType } = a;
        return { id, name, size, mimeType };
      }),
    };
  });
}

export const useConversationStore = create<ConversationState>((set, get) => {
  /** Apply a patch to one conversation in state + storage + summary list. */
  function update(id: string, patch: (c: Conversation) => Conversation) {
    set((state) => {
      const current = state.conversations[id];
      if (!current) return state;
      const next = { ...patch(current), updatedAt: nowIso() };
      persist(next);
      return {
        conversations: { ...state.conversations, [id]: next },
        summaries: sortSummaries([
          {
            id: next.id,
            title: next.title,
            updatedAt: next.updatedAt,
            pinned: next.pinned,
            projectId: next.projectId,
          },
          ...state.summaries.filter((s) => s.id !== id),
        ]),
      };
    });
  }

  async function runStream(id: string, sinceMessageId: string) {
    const conversation = get().conversations[id];
    if (!conversation) return;

    const controller = new AbortController();
    streams.set(id, controller);
    set((s) => ({
      streamingIds: new Set(s.streamingIds).add(id),
      streamStatus: { ...s.streamStatus, [id]: undefined },
    }));

    const provider = getChatProvider();
    const upToUser = conversation.messages.slice(
      0,
      conversation.messages.findIndex((m) => m.id === sinceMessageId) + 1,
    );

    // Humanizer mode: prepend the rewrite instruction as a (non-persisted)
    // system message. Everything else — provider choice, internal routing,
    // fallback, error handling — is unchanged. The identity system message
    // (assistant name, founder answer) rides every request underneath that.
    const outgoing = stripAttachmentData(
      withIdentitySystemMessage(
        activeModeTool(conversation.tools) === "humanizer"
          ? buildHumanizerMessages(upToUser)
          : upToUser,
      ),
    );

    const assistantId = createId("msg");
    update(id, (c) => ({
      ...c,
      messages: [
        ...c.messages,
        {
          id: assistantId,
          role: "assistant",
          parts: [],
          createdAt: nowIso(),
          status: "streaming",
        },
      ],
    }));

    const parts: MessagePart[] = [];
    let activeText: string | null = null;
    let usage: Message["usage"];
    let generation: Message["generation"];

    try {
      for await (const chunk of provider.streamChat({
        messages: outgoing,
        tools: conversation.tools,
        signal: controller.signal,
      })) {
        if (chunk.type === "part-start") {
          if (chunk.part.type === "text") {
            activeText = "";
            parts.push({ type: "text", text: "" });
          } else {
            activeText = null;
            parts.push(chunk.part);
          }
        } else if (chunk.type === "text-delta" && activeText !== null) {
          activeText += chunk.text;
          parts[parts.length - 1] = { type: "text", text: activeText };
        } else if (chunk.type === "part-end") {
          activeText = null;
        } else if (chunk.type === "usage") {
          usage = chunk.usage;
          continue;
        } else if (chunk.type === "status") {
          set((s) => ({
            streamStatus: { ...s.streamStatus, [id]: chunk.label },
          }));
          continue;
        } else if (chunk.type === "done") {
          if (chunk.meta) {
            generation = {
              role: chunk.meta.finalRole,
              category: chunk.meta.category,
              attempts: chunk.meta.attempts,
            };
          }
          continue;
        } else if (chunk.type === "error") {
          useMascotStore.getState().notifyError();
          update(id, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    status: "error",
                    // keep any partial output; the failure is surfaced as a
                    // contextual inline state, not an injected message part.
                    parts: [...parts],
                    error: chunk.message,
                    recoverable: chunk.recoverable ?? true,
                    generation,
                  }
                : m,
            ),
          }));
          return;
        }

        update(id, (c) => ({
          ...c,
          messages: c.messages.map((m) =>
            m.id === assistantId ? { ...m, parts: [...parts] } : m,
          ),
        }));
      }

      if (!controller.signal.aborted) {
        useMascotStore.getState().notifyReceived();
      }
      update(id, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                status: controller.signal.aborted ? "stopped" : "complete",
                usage,
                generation,
              }
            : m,
        ),
      }));
    } finally {
      streams.delete(id);
      flushPersist(id);
      set((s) => {
        const next = new Set(s.streamingIds);
        next.delete(id);
        return {
          streamingIds: next,
          streamStatus: { ...s.streamStatus, [id]: undefined },
        };
      });
    }
  }

  return {
    hydrated: false,
    summaries: [],
    conversations: {},
    streamingIds: new Set(),
    streamStatus: {},

    async hydrate() {
      if (get().hydrated) return;
      await runRetention();
      const summaries = await conversationStore.listSummaries();
      set({ summaries, hydrated: true });
    },

    async searchConversations(query) {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const all = await conversationStore.getAll();
      const results: ConversationSearchResult[] = [];
      for (const c of all) {
        const titleHit = c.title.toLowerCase().includes(q);
        const matchingMessage = c.messages.find((m) =>
          messageText(m).toLowerCase().includes(q),
        );
        if (!titleHit && !matchingMessage) continue;
        results.push({
          id: c.id,
          title: c.title,
          updatedAt: c.updatedAt,
          snippet: matchingMessage
            ? snippetAround(messageText(matchingMessage), q)
            : c.title,
        });
      }
      return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async loadConversation(id) {
      if (get().conversations[id]) return;
      const conversation = await conversationStore.get(id);
      if (conversation) {
        set((s) => ({
          conversations: { ...s.conversations, [id]: conversation },
        }));
      }
    },

    createConversation(seed) {
      const id = createId("c");
      const conversation: Conversation = {
        id,
        title: "New conversation",
        createdAt: nowIso(),
        updatedAt: nowIso(),
        tools: [],
        messages: [],
        ...seed,
      };
      persist(conversation);
      set((s) => ({
        conversations: { ...s.conversations, [id]: conversation },
        summaries: sortSummaries([
          {
            id,
            title: conversation.title,
            updatedAt: conversation.updatedAt,
          },
          ...s.summaries,
        ]),
      }));
      return id;
    },

    async sendMessage(id, text, options) {
      const trimmed = text.trim();
      const attachments = options.attachments;
      if (!trimmed && !attachments?.length) return;
      let conversation = get().conversations[id];
      if (!conversation) {
        await get().loadConversation(id);
        conversation = get().conversations[id];
        if (!conversation) return;
      }

      const userMessage: Message = {
        id: createId("msg"),
        role: "user",
        parts: [{ type: "text", text: trimmed }],
        createdAt: nowIso(),
        attachments,
      };

      const fallbackTitle =
        attachments?.length === 1
          ? attachments[0].name
          : attachments?.length
            ? `${attachments.length} files`
            : undefined;
      const isFirst = conversation.messages.length === 0;
      update(id, (c) => ({
        ...c,
        tools: options.tools,
        title: isFirst
          ? (mockTitleFromPrompt(trimmed) === "New conversation" && fallbackTitle) ||
            mockTitleFromPrompt(trimmed)
          : c.title,
        messages: [...c.messages, userMessage],
      }));

      await runStream(id, userMessage.id);
    },

    stopStreaming(id) {
      streams.get(id)?.abort();
    },

    async regenerate(id) {
      const conversation = get().conversations[id];
      if (!conversation) return;
      const lastUser = [...conversation.messages]
        .reverse()
        .find((m) => m.role === "user");
      if (!lastUser) return;
      update(id, (c) => ({
        ...c,
        messages: c.messages.slice(
          0,
          c.messages.findIndex((m) => m.id === lastUser.id) + 1,
        ),
      }));
      await runStream(id, lastUser.id);
    },

    async editUserMessage(id, messageId, text) {
      const conversation = get().conversations[id];
      if (!conversation) return;
      const index = conversation.messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;
      update(id, (c) => ({
        ...c,
        messages: c.messages.slice(0, index + 1).map((m) =>
          m.id === messageId
            ? {
                ...m,
                parts: [{ type: "text", text: text.trim() }],
                editedAt: nowIso(),
              }
            : m,
        ),
      }));
      await runStream(id, messageId);
    },

    renameConversation(id, title) {
      update(id, (c) => ({ ...c, title: title.trim() || c.title }));
    },

    clearMessages(id) {
      get().stopStreaming(id);
      update(id, (c) => ({ ...c, messages: [], title: "New conversation" }));
    },

    async deleteConversation(id) {
      get().stopStreaming(id);
      await conversationStore.remove(id);
      set((s) => {
        const conversations = { ...s.conversations };
        delete conversations[id];
        return {
          conversations,
          summaries: s.summaries.filter((sum) => sum.id !== id),
        };
      });
    },

    async clearAll() {
      streams.forEach((c) => c.abort());
      streams.clear();
      await conversationStore.clear();
      set({ conversations: {}, summaries: [], streamingIds: new Set() });
    },

    toggleTool(id, tool) {
      update(id, (c) => ({ ...c, tools: toggleToolInList(c.tools, tool) }));
    },
  };
});

function sortSummaries(list: ConversationSummary[]): ConversationSummary[] {
  const seen = new Set<string>();
  return list
    .filter((s) => (seen.has(s.id) ? false : seen.add(s.id)))
    .sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return b.updatedAt.localeCompare(a.updatedAt);
    });
}
