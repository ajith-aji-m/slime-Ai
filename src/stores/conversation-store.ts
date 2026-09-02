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
import { getProviderForModel } from "@/lib/ai";
import { mockTitleFromPrompt } from "@/lib/ai/mock-content";
import { DEFAULT_MODEL_ID } from "@/config/providers";
import { createId, nowIso } from "@/lib/utils/id";

/** Abort controllers for in-flight streams — kept outside React state. */
const streams = new Map<string, AbortController>();

interface SendOptions {
  modelId: string;
  tools: ToolId[];
  attachments?: Attachment[];
}

interface ConversationState {
  hydrated: boolean;
  summaries: ConversationSummary[];
  conversations: Record<string, Conversation>;
  streamingIds: Set<string>;

  hydrate: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: (seed?: Partial<Conversation>) => string;
  sendMessage: (id: string, text: string, options: SendOptions) => Promise<void>;
  stopStreaming: (id: string) => void;
  regenerate: (id: string) => Promise<void>;
  editUserMessage: (id: string, messageId: string, text: string) => Promise<void>;
  renameConversation: (id: string, title: string) => void;
  clearMessages: (id: string) => void;
  deleteConversation: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  setModel: (id: string, modelId: string) => void;
  toggleTool: (id: string, tool: ToolId) => void;
}

function persist(conversation: Conversation) {
  void conversationStore.put(conversation);
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
    set((s) => ({ streamingIds: new Set(s.streamingIds).add(id) }));

    const provider = getProviderForModel(conversation.modelId);
    const upToUser = conversation.messages.slice(
      0,
      conversation.messages.findIndex((m) => m.id === sinceMessageId) + 1,
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
          modelId: c.modelId,
          status: "streaming",
        },
      ],
    }));

    const parts: MessagePart[] = [];
    let activeText: string | null = null;

    try {
      for await (const chunk of provider.streamChat({
        messages: upToUser,
        modelId: conversation.modelId,
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
        } else if (chunk.type === "error") {
          update(id, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    status: "error",
                    parts: [
                      { type: "text", text: `⚠ ${chunk.message}` },
                    ],
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

      update(id, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantId
            ? { ...m, status: controller.signal.aborted ? "stopped" : "complete" }
            : m,
        ),
      }));
    } finally {
      streams.delete(id);
      set((s) => {
        const next = new Set(s.streamingIds);
        next.delete(id);
        return { streamingIds: next };
      });
    }
  }

  return {
    hydrated: false,
    summaries: [],
    conversations: {},
    streamingIds: new Set(),

    async hydrate() {
      if (get().hydrated) return;
      await runRetention();
      const summaries = await conversationStore.listSummaries();
      set({ summaries, hydrated: true });
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
        modelId: DEFAULT_MODEL_ID,
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
      if (!trimmed) return;
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
        attachments: options.attachments,
      };

      const isFirst = conversation.messages.length === 0;
      update(id, (c) => ({
        ...c,
        modelId: options.modelId,
        tools: options.tools,
        title: isFirst ? mockTitleFromPrompt(trimmed) : c.title,
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

    setModel(id, modelId) {
      update(id, (c) => ({ ...c, modelId }));
    },

    toggleTool(id, tool) {
      update(id, (c) => ({
        ...c,
        tools: c.tools.includes(tool)
          ? c.tools.filter((t) => t !== tool)
          : [...c.tools, tool],
      }));
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
