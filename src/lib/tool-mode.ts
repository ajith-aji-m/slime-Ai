import type { ToolId } from "@/types/chat";
import { toolsById } from "@/config/tools";

/**
 * Single shared toggle rule used everywhere a tool selection is changed
 * (composer strip, Intelligence/Tools panel): turning on a "mode" tool
 * (Search / Code / Image Gen / Research) turns off every other mode tool, so
 * at most one is ever active. Non-mode tools (file analysis) toggle
 * independently. Both `composer-store` and `conversation-store` route through
 * this so the two UIs can never disagree about what's selected.
 */
export function toggleToolInList(active: ToolId[], id: ToolId): ToolId[] {
  const isOn = active.includes(id);
  if (isOn) return active.filter((t) => t !== id);
  if (toolsById[id]?.mode) {
    return [...active.filter((t) => !toolsById[t]?.mode), id];
  }
  return [...active, id];
}
