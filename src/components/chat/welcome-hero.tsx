"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SlimeMark } from "@/components/ui";
import { useSettingsStore } from "@/stores/settings-store";
import { useMascotStore } from "@/stores/mascot-store";

export function WelcomeHero() {
  const router = useRouter();
  const displayName = useSettingsStore((s) => s.displayName);
  const name = displayName && displayName !== "You" ? displayName : null;
  const action = useMascotStore((s) => s.action);

  // The very first message of a session hits `/chat/[conversationId]` before
  // that route has ever been requested, so the dev server has to compile it
  // on demand — a multi-second one-off stall that makes the just-sent
  // message look stuck instead of appearing instantly like every message
  // after it. Warming the route here, while the user is still reading/typing
  // on the welcome screen, moves that compile off the critical path (a no-op
  // once it's warm, and cheap in production too).
  useEffect(() => {
    router.prefetch("/chat/prefetch-warmup");
  }, [router]);

  return (
    <div className="animate-fade-in-up mx-auto max-w-xl text-center">
      <SlimeMark
        size={150}
        ripple
        mood={action}
        className="mx-auto mb-6"
      />
      <h2 className="text-2xl font-bold tracking-tight text-on-surface drop-shadow-md sm:text-3xl">
        {name ? `Welcome back, ${name}` : "How can I assist you today?"}
      </h2>
      <p className="mt-2 text-[15px] text-on-surface-variant md:text-base">
        What would you like to work on today?
      </p>
    </div>
  );
}
