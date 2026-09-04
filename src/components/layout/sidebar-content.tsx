"use client";

import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { PrimaryNavLinks, SecondaryNavLinks } from "./primary-nav";
import { ConversationList } from "./conversation-list";
import { UserProfile } from "./user-profile";
import { IconButton } from "@/components/ui";

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
    // Land on the welcome screen; the conversation is created on the first
    // message, so repeated clicks don't litter the history with empty chats.
    onNavigate?.();
    router.push("/chat");
  }

  return (
    <div className="flex h-full w-full min-w-0 flex-col py-4">
      <div className="mb-4 flex items-center gap-1 px-3">
        <Brand showChevron={!showClose} />
        {showClose ? (
          <IconButton icon="close" label="Close menu" onClick={onNavigate} />
        ) : null}
      </div>

      <PrimaryNavLinks onNavigate={onNavigate} onNewChat={handleNewChat} />

      <div className="my-1 flex min-h-0 w-full min-w-0 flex-1 flex-col">
        <ConversationList onNavigate={onNavigate} />
      </div>

      <SecondaryNavLinks onNavigate={onNavigate} />
      <UserProfile />
    </div>
  );
}
