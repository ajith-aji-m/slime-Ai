import type { IconName } from "@/components/ui/icon";

export interface NavItemConfig {
  label: string;
  href: string;
  icon: IconName;
  /** Rendered in the secondary group at the bottom of the sidebar. */
  section: "primary" | "secondary";
}

/**
 * Primary workspace navigation. Deliberately minimal: navigation + workspace
 * management only. Files, Sources, Tools and Activity are NOT listed here —
 * they're already available in the chat Intelligence panel, and per-task
 * capabilities (code, research, image generation, data analysis) live in the
 * composer and Canvas, not as standalone sidebar destinations.
 */
export const navigation: NavItemConfig[] = [
  { label: "Chats", href: "/chat", icon: "chat", section: "primary" },
  { label: "Projects", href: "/projects", icon: "folder", section: "primary" },
  { label: "Tasks", href: "/tasks", icon: "task_alt", section: "primary" },
  { label: "Agents", href: "/agents", icon: "smart_toy", section: "primary" },
  { label: "Settings", href: "/settings", icon: "settings", section: "secondary" },
  { label: "Help", href: "/help", icon: "help", section: "secondary" },
];

/**
 * Links shown in the desktop top app bar. Empty for now — capability navigation
 * is not surfaced here to keep the workspace focused on the conversation.
 */
export const topBarLinks: { label: string; href: string }[] = [];
