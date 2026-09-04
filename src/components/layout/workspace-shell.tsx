"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui";
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
  const pathname = usePathname();
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

  return (
    <div
      className="sl-mode-root flex h-full w-full gap-0 overflow-hidden p-0 md:gap-3.5 md:p-3.5"
      data-mode={onChat ? activeMode : undefined}
    >
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
          {children}
        </main>
      </div>

      {showContextPanel ? (
        <aside className="liquid-glass hidden w-context-panel shrink-0 overflow-hidden rounded-3xl xl:flex">
          <ContextPanel emptyContext={emptyContext} />
        </aside>
      ) : null}

      {onChat ? <CanvasShell /> : null}

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
        <ContextPanel layout="stacked" emptyContext={emptyContext} />
      </Drawer>
    </div>
  );
}
