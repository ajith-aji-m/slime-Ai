"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, Icon } from "@/components/ui";
import { Popover } from "@/components/ui/popover";
import { useSettingsStore } from "@/stores/settings-store";

const PLAN_LABEL: Record<string, string> = {
  local: "Free Plan",
  "cloud-backup": "Backup Plan",
  "cloud-sync": "Sync Plan",
};

export function UserProfile({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const displayName = useSettingsStore((s) => s.displayName);
  const syncTier = useSettingsStore((s) => s.syncTier);
  const name = displayName === "You" ? "Your account" : displayName;

  return (
    <div className="mt-2 flex items-center gap-2.5 border-t border-outline-variant px-4 pt-3">
      <Avatar name={name} size={32} />
      <span className="min-w-0 flex-1 leading-tight">
        <span className="block truncate text-sm font-semibold text-on-surface">
          {name}
        </span>
        <span className="block truncate text-[11px] text-on-surface-variant">
          {PLAN_LABEL[syncTier] ?? "Free Plan"}
        </span>
      </span>

      <Popover
        align="end"
        trigger={({ toggle, open }) => (
          <button
            type="button"
            onClick={toggle}
            aria-label="Account menu"
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-on-surface-variant transition-colors hover:bg-surface-variant hover:text-on-surface"
          >
            <Icon name="more_horiz" size={18} />
          </button>
        )}
      >
        {({ close }) => (
          <div className="min-w-[180px]">
            <Link
              href="/settings"
              onClick={() => {
                close();
                onNavigate?.();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface transition-colors hover:bg-surface-variant"
            >
              <Icon name="settings" size={16} />
              Settings
            </Link>
            <button
              type="button"
              onClick={() => {
                close();
                onNavigate?.();
                router.push("/login");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-on-surface transition-colors hover:bg-surface-variant"
            >
              <Icon name="logout" size={16} />
              Sign out
            </button>
          </div>
        )}
      </Popover>
    </div>
  );
}
