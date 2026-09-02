import {
  createStore,
  del,
  get,
  set,
  keys,
  getMany,
} from "idb-keyval";
import type { Conversation, ConversationSummary } from "@/types/chat";
import type { ConversationStore } from "@/types/storage";

const store = createStore("slime-ai", "conversations");
const KEY = (id: string) => `conv:${id}`;

function toSummary(c: Conversation): ConversationSummary {
  return {
    id: c.id,
    title: c.title,
    updatedAt: c.updatedAt,
    pinned: c.pinned,
    projectId: c.projectId,
  };
}

/**
 * IndexedDB-backed conversation store — the default local-first persistence.
 * Implements the same `ConversationStore` contract a cloud adapter will.
 */
export const localConversationStore: ConversationStore = {
  async listSummaries() {
    const allKeys = (await keys(store)).filter(
      (k): k is string => typeof k === "string" && k.startsWith("conv:"),
    );
    const rows = await getMany<Conversation | undefined>(allKeys, store);
    return rows
      .filter((c): c is Conversation => Boolean(c))
      .map(toSummary)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async get(id) {
    return (await get<Conversation>(KEY(id), store)) ?? null;
  },

  async put(conversation) {
    await set(KEY(conversation.id), conversation, store);
  },

  async remove(id) {
    await del(KEY(id), store);
  },

  async clear() {
    const allKeys = (await keys(store)).filter(
      (k): k is string => typeof k === "string" && k.startsWith("conv:"),
    );
    await Promise.all(allKeys.map((k) => del(k, store)));
  },

  async pruneOlderThan(isoCutoff) {
    const allKeys = (await keys(store)).filter(
      (k): k is string => typeof k === "string" && k.startsWith("conv:"),
    );
    const rows = await getMany<Conversation | undefined>(allKeys, store);
    const removed: string[] = [];
    await Promise.all(
      rows
        .filter((c): c is Conversation => Boolean(c))
        .map(async (c) => {
        if (!c.pinned && c.updatedAt < isoCutoff) {
          await del(KEY(c.id), store);
          removed.push(c.id);
        }
      }),
    );
    return removed;
  },
};
