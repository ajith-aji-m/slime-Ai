import type { Metadata } from "next";
import { WelcomeHero } from "@/components/chat/welcome-hero";
import { SuggestionGrid } from "@/components/chat/suggestion-grid";
import { QuickActions } from "@/components/chat/quick-actions";
import { Composer } from "@/components/chat/composer";

export const metadata: Metadata = { title: "New chat" };

export default function ChatWelcomePage() {
  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex min-h-full w-full max-w-3xl flex-col items-center justify-center gap-7 px-5 py-8 sm:gap-9 sm:px-6 sm:py-12">
          <WelcomeHero />
          <SuggestionGrid />
          <QuickActions />
        </div>
      </div>
      <div className="shrink-0 px-5 pb-5 pt-2 sm:px-6 sm:pb-8">
        <Composer variant="hero" autoFocus showToolStrip={false} />
      </div>
    </div>
  );
}
