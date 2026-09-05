"use client";

import { SlimeMark } from "@/components/ui";
import { useSettingsStore } from "@/stores/settings-store";
import { useMascotStore } from "@/stores/mascot-store";

export function WelcomeHero() {
  const displayName = useSettingsStore((s) => s.displayName);
  const name = displayName && displayName !== "You" ? displayName : null;
  const action = useMascotStore((s) => s.action);

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
