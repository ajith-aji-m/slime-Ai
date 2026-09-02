"use client";

import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { PrimaryNav } from "./primary-nav";
import { Button, IconButton } from "@/components/ui";
import { useConversationStore } from "@/stores/conversation-store";

/**
 * Sidebar body — shared verbatim between the desktop rail and the mobile nav
 * drawer (no duplicate desktop/mobile components).
 */
export function SidebarContent({
  onNavigate,
  showClose = false,
}: {
  onNavigate?: () => void;
  showClose?: boolean;
}) {
  const router = useRouter();
  const createConversation = useConversationStore((s) => s.createConversation);

  function handleNewChat() {
    const id = createConversation();
    onNavigate?.();
    router.push(`/chat/${id}`);
  }

  return (
    <div className="flex h-full flex-col py-6">
      <div className="mb-6 flex items-center justify-between gap-2 px-6">
        <Brand />
        {showClose ? (
          <IconButton icon="close" label="Close menu" onClick={onNavigate} />
        ) : null}
      </div>

      <div className="mb-6 px-4">
        <Button fullWidth size="lg" iconLeft="add" onClick={handleNewChat}>
          New Chat
        </Button>
      </div>

      <PrimaryNav onNavigate={onNavigate} />
    </div>
  );
}
