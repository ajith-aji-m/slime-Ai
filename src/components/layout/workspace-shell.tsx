"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Drawer } from "@/components/ui";
import { SidebarContent } from "./sidebar-content";
import { TopAppBar } from "./top-app-bar";
import { ContextPanel } from "@/components/context-panel/context-panel";
import { isChatRoute } from "@/lib/page-meta";
import { useUiStore } from "@/stores/ui-store";
import { useConversationStore } from "@/stores/conversation-store";

/**
 * The persistent workspace frame: left rail + main column + optional Intelligence
 * panel on desktop, off-canvas drawers on mobile. One responsive tree — no
 * separate desktop/mobile shells.
 */
export function WorkspaceShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const showContextPanel = isChatRoute(pathname);
  const emptyContext = pathname === "/chat";

  const navDrawerOpen = useUiStore((s) => s.navDrawerOpen);
  const contextDrawerOpen = useUiStore((s) => s.contextDrawerOpen);
  const closeDrawers = useUiStore((s) => s.closeDrawers);

  useEffect(() => {
    void useConversationStore.getState().hydrate();
  }, []);

  useEffect(() => {
    closeDrawers();
  }, [pathname, closeDrawers]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-on-primary"
      >
        Skip to main content
      </a>
      <aside className="hidden w-sidebar shrink-0 overflow-hidden border-r border-outline-variant bg-surface-container-low md:flex">
        <SidebarContent />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col bg-surface-container-lowest">
        <TopAppBar />
        <main id="main" className="min-h-0 flex-1">
          {children}
        </main>
      </div>

      {showContextPanel ? (
        <aside className="hidden w-context-panel shrink-0 border-l border-outline-variant bg-surface-container-lowest xl:flex">
          <ContextPanel emptyContext={emptyContext} />
        </aside>
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
        <ContextPanel layout="stacked" emptyContext={emptyContext} />
      </Drawer>
    </div>
  );
}
