"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { Avatar, Button, IconButton } from "@/components/ui";
import { topBarLinks } from "@/config/navigation";
import { pageTitleFromPath, isChatRoute } from "@/lib/page-meta";
import { cn } from "@/lib/utils/cn";
import { useUiStore } from "@/stores/ui-store";
import { useConversationStore } from "@/stores/conversation-store";
import { useCanvasStore } from "@/stores/canvas-store";

export function TopAppBar() {
  const pathname = usePathname();
  const params = useParams<{ conversationId?: string }>();
  const openNavDrawer = useUiStore((s) => s.openNavDrawer);
  const openContextDrawer = useUiStore((s) => s.openContextDrawer);

  const conversationTitle = useConversationStore((s) =>
    params.conversationId
      ? s.conversations[params.conversationId]?.title
      : undefined,
  );
  const title = conversationTitle ?? pageTitleFromPath(pathname);
  const onChat = isChatRoute(pathname);

  const canvasOpen = useCanvasStore((s) => s.open);
  const canvasOrder = useCanvasStore((s) => s.order);
  const canvasArtifacts = useCanvasStore((s) => s.artifacts);
  const openArtifact = useCanvasStore((s) => s.openArtifact);
  const closeCanvas = useCanvasStore((s) => s.close);

  const conversationArtifacts = canvasOrder.filter(
    (id) => canvasArtifacts[id]?.conversationId === params.conversationId,
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 w-full items-center justify-between gap-4",
        "bg-transparent px-4 md:px-6",
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
        <IconButton
          icon="menu"
          label="Open menu"
          variant="glass"
          className="md:hidden"
          onClick={openNavDrawer}
        />
        <h1 className="truncate text-base font-semibold text-on-surface md:text-lg">
          {title}
        </h1>
      </div>

      <nav className="hidden shrink-0 items-center gap-6 text-sm font-medium xl:flex">
        {topBarLinks.map((link) => {
          const active =
            pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition-colors",
                active
                  ? "border-b-2 border-primary pb-0.5 font-semibold text-primary"
                  : "text-on-surface-variant hover:text-primary",
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
        <IconButton icon="history" label="History" variant="glass" />
        <IconButton
          icon="notifications"
          label="Notifications"
          variant="glass"
          className="hidden md:inline-flex"
        />
        {onChat && conversationArtifacts.length > 0 ? (
          <IconButton
            icon="space_dashboard"
            label={canvasOpen ? "Hide Canvas" : "Open Canvas"}
            variant="glass"
            filled={canvasOpen}
            active={canvasOpen}
            className={canvasOpen ? "text-primary" : undefined}
            onClick={() =>
              canvasOpen
                ? closeCanvas()
                : openArtifact(
                    conversationArtifacts[conversationArtifacts.length - 1],
                  )
            }
          />
        ) : null}
        {onChat ? (
          <IconButton
            icon="analytics"
            label="Toggle Intelligence panel"
            variant="glass"
            filled
            className="text-primary xl:hidden"
            onClick={openContextDrawer}
          />
        ) : null}
        <Button
          variant="glass"
          size="sm"
          pill
          iconLeft="share"
          className="ml-1 hidden !rounded-xl md:inline-flex"
        >
          Share
        </Button>
        <Link
          href="/settings"
          aria-label="Account"
          className="liquid-inner ml-1 hidden !rounded-xl md:block"
        >
          <Avatar name="You" size={34} className="border-0 bg-transparent text-on-surface-variant" />
        </Link>
      </div>
    </header>
  );
}
