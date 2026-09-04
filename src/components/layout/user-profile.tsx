"use client";

import { useSettingsStore } from "@/stores/settings-store";

const PLAN_LABEL: Record<string, string> = {
  local: "Free Plan",
  "cloud-backup": "Backup Plan",
  "cloud-sync": "Sync Plan",
};

export function UserProfile() {
  const displayName = useSettingsStore((s) => s.displayName);
  const syncTier = useSettingsStore((s) => s.syncTier);
  const name = displayName === "You" ? "Your account" : displayName;

  return (
    <div className="liquid-inner mx-2 mt-2 flex items-center gap-2.5 rounded-2xl px-3 py-2">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-fuchsia-500 to-indigo-400 text-[11px] font-bold text-white shadow-md">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-[13px] font-semibold text-on-surface">
          {name}
        </span>
        <span className="block truncate text-[11px] text-on-surface-variant">
          {PLAN_LABEL[syncTier] ?? "Free Plan"}
        </span>
      </span>
    </div>
  );
}
