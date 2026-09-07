import { describe, it, expect } from "vitest";
import { useConversationStore } from "@/stores/conversation-store";

async function waitForStream(id: string) {
  while (useConversationStore.getState().streamingIds.has(id)) {
    await new Promise((r) => setTimeout(r, 20));
  }
}

describe("prompt_generator mode end-to-end (mock provider)", () => {
  it("produces a structured prompt for a message sent in prompt_generator mode", async () => {
    const id = useConversationStore
      .getState()
      .createConversation({ tools: ["prompt_generator"] });
    await useConversationStore
      .getState()
      .sendMessage(id, "write a function to debounce a search input", {
        tools: ["prompt_generator"],
      });
    await waitForStream(id);

    const conversation = useConversationStore.getState().conversations[id];
    const assistant = conversation.messages[1];
    expect(assistant.status).toBe("complete");
    const text = assistant.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("\n");
    expect(text).toContain("## Role");
    expect(text).toContain("## Task");
  });
});
