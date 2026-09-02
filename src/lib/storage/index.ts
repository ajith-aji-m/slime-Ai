import type { ConversationStore } from "@/types/storage";
import { DEFAULT_RETENTION, type RetentionPolicy } from "@/config/retention";
import { localConversationStore } from "./local-adapter";

/**
 * The active conversation store. Swap this for a `CloudSyncAdapter` (or a
 * composite local+cloud adapter) when a paid plan is enabled — no caller changes.
 */
export const conversationStore: ConversationStore = localConversationStore;

/** Runs retention rules. Call once on app boot. */
export async function runRetention(
  policy: RetentionPolicy = DEFAULT_RETENTION,
): Promise<string[]> {
  if (!policy.autoCleanup) return [];
  const removed: string[] = [];

  if (policy.maxAgeDays > 0) {
    const cutoff = new Date(
      Date.now() - policy.maxAgeDays * 86_400_000,
    ).toISOString();
    removed.push(...(await conversationStore.pruneOlderThan(cutoff)));
  }

  if (policy.maxConversations > 0) {
    const summaries = await conversationStore.listSummaries();
    const overflow = summaries
      .filter((s) => !s.pinned)
      .slice(policy.maxConversations);
    for (const s of overflow) {
      await conversationStore.remove(s.id);
      removed.push(s.id);
    }
  }

  return removed;
}
