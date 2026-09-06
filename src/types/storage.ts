import type { Conversation, ConversationSummary } from "./chat";

/**
 * Local-first persistence contract.
 *
 * `LocalStorageAdapter` (IndexedDB) is the default and only implementation today.
 * A future `CloudSyncAdapter` implements the same interface so enabling a paid
 * plan (backup / multi-device sync / account history) needs no UI changes.
 */
export interface ConversationStore {
  listSummaries(): Promise<ConversationSummary[]>;
  get(id: string): Promise<Conversation | null>;
  put(conversation: Conversation): Promise<void>;
  remove(id: string): Promise<void>;
  /** delete every conversation (used by "Clear all history") */
  clear(): Promise<void>;
  /** delete conversations not updated since the given ISO cutoff */
  pruneOlderThan(isoCutoff: string): Promise<string[]>;
  /** every full conversation (bodies included) — used for local content search */
  getAll(): Promise<Conversation[]>;
}

export type SyncTier = "local" | "cloud-backup" | "cloud-sync";

export interface StorageStatus {
  tier: SyncTier;
  lastSyncedAt: string | null;
  /** approximate bytes used locally */
  usageBytes: number;
}
