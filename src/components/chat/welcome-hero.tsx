"use client";

import { Icon } from "@/components/ui";
import { useSettingsStore } from "@/stores/settings-store";

export function WelcomeHero() {
  const displayName = useSettingsStore((s) => s.displayName);
  const name = displayName && displayName !== "You" ? displayName : null;

  return (
    <div className="animate-fade-in-up mx-auto max-w-xl text-center">
      <div className="mx-auto mb-7 inline-flex h-[68px] w-[68px] items-center justify-center rounded-full border border-primary/15 bg-surface-container-lowest text-primary shadow-[0_0_44px_-10px_rgba(124,58,237,0.4)]">
        <Icon name="auto_awesome" size={30} />
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-on-surface md:text-[2rem]">
        {name ? `Welcome back, ${name}` : "Welcome back"}
      </h2>
      <p className="mt-2.5 text-base text-on-surface-variant md:text-lg">
        What would you like to work on today?
      </p>
    </div>
  );
}
