"use client";

import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { PrimaryNavLinks, SecondaryNavLinks } from "./primary-nav";
import { ConversationList } from "./conversation-list";
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

  function handleNewChat() {
    const id = useConversationStore.getState().createConversation();
    onNavigate?.();
    router.push(`/chat/${id}`);
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col py-6">
      <div className="mb-6 flex items-center justify-between gap-2 px-6">
        <Brand />
        {showClose ? (
          <IconButton icon="close" label="Close menu" onClick={onNavigate} />
        ) : null}
      </div>

      <div className="mb-4 px-4">
        <Button fullWidth size="lg" iconLeft="add" onClick={handleNewChat}>
          New Chat
        </Button>
      </div>

      <PrimaryNavLinks onNavigate={onNavigate} />

      <div className="my-2 min-h-0 w-full min-w-0 flex-1">
        <ConversationList onNavigate={onNavigate} />
      </div>

      <SecondaryNavLinks onNavigate={onNavigate} />
    </div>
  );
}
