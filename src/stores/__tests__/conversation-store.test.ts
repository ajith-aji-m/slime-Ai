import { describe, it, expect } from "vitest";
import { useConversationStore } from "../conversation-store";

/** poll until the conversation is no longer streaming (mock provider uses real timers) */
async function waitForStream(id: string) {
  while (useConversationStore.getState().streamingIds.has(id)) {
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe("conversation-store", () => {
  it("createConversation starts empty and is tracked in summaries", () => {
    const id = useConversationStore.getState().createConversation({ tools: [] });
    const state = useConversationStore.getState();
    expect(state.conversations[id]).toBeDefined();
    expect(state.conversations[id].messages).toHaveLength(0);
    expect(state.summaries.some((s) => s.id === id)).toBe(true);
  });

  it(
    "sendMessage adds the user message immediately, then streams an assistant reply",
    async () => {
      const id = useConversationStore.getState().createConversation({ tools: [] });
      const send = useConversationStore.getState().sendMessage(id, "hello slime", {
        tools: [],
      });

      // the user message is appended synchronously, before any stream I/O
      const afterSend = useConversationStore.getState().conversations[id];
      expect(afterSend.messages).toHaveLength(2); // user + streaming assistant placeholder
      expect(afterSend.messages[0].role).toBe("user");

      await send;
      await waitForStream(id);

      const final = useConversationStore.getState().conversations[id];
      const assistant = final.messages[1];
      expect(assistant.role).toBe("assistant");
      expect(assistant.status).toBe("complete");
      expect(assistant.parts.length).toBeGreaterThan(0);
    },
    10_000,
  );

  it(
    "regenerate replaces the assistant reply for the last user message",
    async () => {
      const id = useConversationStore.getState().createConversation({ tools: [] });
      await useConversationStore.getState().sendMessage(id, "regen me", { tools: [] });
      await waitForStream(id);

      const before = useConversationStore.getState().conversations[id].messages.length;
      await useConversationStore.getState().regenerate(id);
      await waitForStream(id);

      const after = useConversationStore.getState().conversations[id];
      expect(after.messages).toHaveLength(before);
      expect(after.messages.at(-1)?.status).toBe("complete");
    },
    10_000,
  );

  it(
    "searchConversations finds a conversation by message content",
    async () => {
      const id = useConversationStore
        .getState()
        .createConversation({ tools: [] });
      await useConversationStore
        .getState()
        .sendMessage(id, "a very unique needle phrase", { tools: [] });
      await waitForStream(id);

      const results = await useConversationStore
        .getState()
        .searchConversations("unique needle");
      expect(results.some((r) => r.id === id)).toBe(true);
    },
    10_000,
  );

  it("searchConversations returns nothing for an empty query", async () => {
    const results = await useConversationStore.getState().searchConversations("   ");
    expect(results).toEqual([]);
  });
});
