/**
 * Local chat-history retention. The cleanup job in `lib/storage` reads this on
 * app boot. A future cloud plan can raise/disable these limits per account.
 */
export interface RetentionPolicy {
  /** delete conversations untouched for longer than this many days; 0 = keep forever */
  maxAgeDays: number;
  /** hard cap on stored conversations; oldest pruned first; 0 = unlimited */
  maxConversations: number;
  /** run the prune pass automatically on load */
  autoCleanup: boolean;
}

export const DEFAULT_RETENTION: RetentionPolicy = {
  maxAgeDays: 0,
  maxConversations: 200,
  autoCleanup: true,
};

export const RETENTION_PRESETS: { label: string; days: number }[] = [
  { label: "Keep forever", days: 0 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
  { label: "1 year", days: 365 },
];
