"use client";

import { useState } from "react";
import { Button, Card, Chip, Icon } from "@/components/ui";
import { RETENTION_PRESETS } from "@/config/retention";
import { conversationStore } from "@/lib/storage";
import { useConversationStore } from "@/stores/conversation-store";
import { useSettingsStore } from "@/stores/settings-store";
import { cn } from "@/lib/utils/cn";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-8">
      <h3 className="text-sm font-semibold text-on-surface">{title}</h3>
      {description ? (
        <p className="mb-3 mt-0.5 text-xs text-on-surface-variant">
          {description}
        </p>
      ) : (
        <div className="mb-3" />
      )}
      {children}
    </section>
  );
}

export function SettingsView() {
  const { displayName, email, retention, syncTier, setProfile, setRetention } =
    useSettingsStore();
  const summaries = useConversationStore((s) => s.summaries);
  const clearAll = useConversationStore((s) => s.clearAll);
  const hydrate = useConversationStore((s) => s.hydrate);
  const [confirming, setConfirming] = useState(false);
  const [pruning, setPruning] = useState(false);

  async function pruneNow(days: number) {
    setPruning(true);
    const cutoff = new Date(Date.now() - days * 86_400_000).toISOString();
    await conversationStore.pruneOlderThan(cutoff);
    // refresh summaries
    useConversationStore.setState({ hydrated: false });
    await hydrate();
    setPruning(false);
  }

  return (
    <div>
      <Section title="Profile">
        <Card className="space-y-4 p-5">
          <label className="block">
            <span className="text-xs font-medium text-on-surface-variant">
              Display name
            </span>
            <input
              value={displayName}
              onChange={(e) => setProfile({ displayName: e.target.value })}
              className="sl-field mt-1"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-on-surface-variant">
              Email
            </span>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setProfile({ email: e.target.value })}
              className="sl-field mt-1"
            />
          </label>
        </Card>
      </Section>

      <Section
        title="Appearance"
        description="Slime AI uses the light visual direction. A dark theme is planned."
      >
        <Card className="flex items-center gap-3 p-4">
          <Icon name="auto_awesome" size={18} className="text-primary" />
          <span className="text-sm text-on-surface">Light</span>
          <Chip className="ml-auto">Active</Chip>
        </Card>
      </Section>

      <Section
        title="Storage &amp; sync"
        description="Chat history is stored on this device. Cloud backup and multi-device sync arrive with a paid plan."
      >
        <Card className="flex items-center gap-3 p-4">
          <Icon name="cloud" size={18} className="text-on-surface-variant" />
          <div className="flex-1">
            <p className="text-sm text-on-surface">
              {syncTier === "local" ? "On this device" : syncTier}
            </p>
            <p className="text-xs text-on-surface-variant">
              {summaries.length} conversation{summaries.length === 1 ? "" : "s"} stored
              locally
            </p>
          </div>
          <Button size="sm" variant="outline" disabled>
            Enable cloud backup
          </Button>
        </Card>
      </Section>

      <Section
        title="History retention"
        description="Automatically remove old conversations. Pinned chats are kept."
      >
        <Card className="p-4">
          <div className="flex flex-wrap gap-2">
            {RETENTION_PRESETS.map((preset) => (
              <button
                key={preset.days}
                type="button"
                onClick={() => setRetention({ maxAgeDays: preset.days })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  retention.maxAgeDays === preset.days
                    ? "border-primary bg-primary-container/15 text-primary"
                    : "border-outline-variant text-on-surface-variant hover:bg-surface-variant",
                )}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {retention.maxAgeDays > 0 ? (
            <div className="mt-4 flex items-center gap-3">
              <Button
                size="sm"
                variant="outline"
                iconLeft="delete_sweep"
                disabled={pruning}
                onClick={() => pruneNow(retention.maxAgeDays)}
              >
                Clean up now
              </Button>
              <span className="text-xs text-on-surface-variant">
                Removes conversations older than {retention.maxAgeDays} days
              </span>
            </div>
          ) : null}
        </Card>
      </Section>

      <Section
        title="Danger zone"
        description="These actions cannot be undone."
      >
        <Card className="border-error/40 p-4">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-on-surface">
                Delete all {summaries.length} conversations from this device?
              </span>
              <Button
                size="sm"
                className="bg-error text-on-error hover:bg-error/90 hover:text-on-error"
                onClick={async () => {
                  await clearAll();
                  setConfirming(false);
                }}
              >
                Delete everything
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirming(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              iconLeft="delete"
              className="border-error/40 text-error hover:bg-error-container"
              onClick={() => setConfirming(true)}
            >
              Clear all chat history
            </Button>
          )}
        </Card>
      </Section>
    </div>
  );
}
