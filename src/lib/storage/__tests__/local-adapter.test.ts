import { describe, it, expect } from "vitest";
import { localConversationStore } from "../local-adapter";
import type { Conversation } from "@/types/chat";

function makeConversation(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: `c-${Math.random().toString(36).slice(2)}`,
    title: "Test conversation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tools: [],
    messages: [],
    ...overrides,
  };
}

describe("localConversationStore", () => {
  it("put/get round-trips a conversation", async () => {
    const conversation = makeConversation();
    await localConversationStore.put(conversation);
    const loaded = await localConversationStore.get(conversation.id);
    expect(loaded?.id).toBe(conversation.id);
    expect(loaded?.title).toBe(conversation.title);
  });

  it("listSummaries reflects stored conversations, newest first", async () => {
    const older = makeConversation({ updatedAt: "2020-01-01T00:00:00.000Z" });
    const newer = makeConversation({ updatedAt: "2030-01-01T00:00:00.000Z" });
    await localConversationStore.put(older);
    await localConversationStore.put(newer);

    const summaries = await localConversationStore.listSummaries();
    const olderIdx = summaries.findIndex((s) => s.id === older.id);
    const newerIdx = summaries.findIndex((s) => s.id === newer.id);
    expect(newerIdx).toBeLessThan(olderIdx);
  });

  it("remove deletes a conversation", async () => {
    const conversation = makeConversation();
    await localConversationStore.put(conversation);
    await localConversationStore.remove(conversation.id);
    expect(await localConversationStore.get(conversation.id)).toBeNull();
  });

  it("getAll returns full conversation bodies for search", async () => {
    const conversation = makeConversation({
      messages: [
        {
          id: "m1",
          role: "user",
          parts: [{ type: "text", text: "findable content" }],
          createdAt: new Date().toISOString(),
        },
      ],
    });
    await localConversationStore.put(conversation);
    const all = await localConversationStore.getAll();
    const found = all.find((c) => c.id === conversation.id);
    expect(found?.messages[0].parts[0]).toMatchObject({ text: "findable content" });
  });
});
