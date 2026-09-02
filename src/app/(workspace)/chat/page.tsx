import type { Metadata } from "next";
import { WelcomeHero } from "@/components/chat/welcome-hero";
import { SuggestionGrid } from "@/components/chat/suggestion-grid";
import { Composer } from "@/components/chat/composer";

export const metadata: Metadata = { title: "New chat" };

export default function ChatWelcomePage() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-1 flex-col items-center justify-center gap-12 overflow-y-auto px-4 py-10">
        <WelcomeHero />
        <SuggestionGrid />
      </div>
      <div className="shrink-0 px-4 pb-8 pt-2">
        <Composer variant="hero" autoFocus />
      </div>
    </div>
  );
}
