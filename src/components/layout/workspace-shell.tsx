"use client";

import { useEffect } from "react";
import { usePathname, useParams, useRouter } from "next/navigation";
import { Drawer } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { AmbientBackdrop } from "./ambient-backdrop";
import { SidebarContent } from "./sidebar-content";
import { TopAppBar } from "./top-app-bar";
import { ContextPanel } from "@/components/context-panel/context-panel";
import { CanvasShell } from "@/components/canvas/canvas-shell";
import { isChatRoute } from "@/lib/page-meta";
import { useUiStore } from "@/stores/ui-store";
import { useConversationStore } from "@/stores/conversation-store";
import { useAiStatusStore } from "@/stores/ai-status-store";
import { useCanvasStore } from "@/stores/canvas-store";
import { useActiveToolMode } from "@/hooks/use-active-tool-mode";

/**
 * The persistent workspace frame: left rail + main column + optional Intelligence
 * panel on desktop, off-canvas drawers on mobile. One responsive tree — no
 * separate desktop/mobile shells.
 */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ conversationId?: string }>();
  const onChat = isChatRoute(pathname);
  const emptyContext = pathname === "/chat";

  const navDrawerOpen = useUiStore((s) => s.navDrawerOpen);
  const contextDrawerOpen = useUiStore((s) => s.contextDrawerOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);
  const canvasOpen = useCanvasStore((s) => s.open);
  const activeMode = useActiveToolMode();

  // Canvas takes the right side of the workspace; the Intelligence panel yields
  // to it while it's open.
  const showContextPanel = onChat && !canvasOpen;

  useEffect(() => {
    void useConversationStore.getState().hydrate();
    void useAiStatusStore.getState().refresh();
  }, []);

  useEffect(() => {
    closeDrawers();
    useCanvasStore.getState().collapseForRoute();
  }, [pathname, closeDrawers]);

  // Cmd/Ctrl+Shift+O — the same shortcut ChatGPT/Claude use for "new chat".
  // Skipped while focus is in an editable field so it never fights typing.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const editing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable;
      if (editing) return;
      const modifier = e.metaKey || e.ctrlKey;
      if (modifier && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        router.push("/chat");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <div
      className="sl-mode-root flex h-full w-full gap-0 overflow-hidden p-0 md:gap-3.5 md:p-3.5"
      data-mode={onChat ? activeMode : undefined}
    >
      <AmbientBackdrop />
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-primary"
      >
        Skip to main content
      </a>
      <aside className="liquid-glass hidden w-sidebar shrink-0 overflow-hidden rounded-3xl md:flex">
        <SidebarContent />
      </aside>

      <div className="liquid-glass flex min-w-0 flex-1 flex-col overflow-hidden md:rounded-3xl">
        <TopAppBar />
        <main id="main" className="min-h-0 flex-1">
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>
      </div>

      {showContextPanel ? (
        <aside className="liquid-glass hidden w-context-panel shrink-0 overflow-hidden rounded-3xl xl:flex">
          <ContextPanel
            conversationId={params.conversationId}
            emptyContext={emptyContext}
          />
        </aside>
      ) : null}

      {onChat ? (
        <ErrorBoundary label="Canvas hit a problem">
          <CanvasShell />
        </ErrorBoundary>
      ) : null}

      <Drawer
        open={navDrawerOpen}
        onClose={closeDrawers}
        side="left"
        label="Main navigation"
      >
        <SidebarContent onNavigate={closeDrawers} showClose />
      </Drawer>

      <Drawer
        open={contextDrawerOpen}
        onClose={closeDrawers}
        side="right"
        label="Intelligence panel"
      >
        <ContextPanel
          layout="stacked"
          conversationId={params.conversationId}
          emptyContext={emptyContext}
        />
      </Drawer>
    </div>
  );
}
