import type { IconName } from "@/components/ui/icon";

export interface NavItemConfig {
  label: string;
  href: string;
  icon: IconName;
  /** Rendered in the secondary group at the bottom of the sidebar. */
  section: "primary" | "secondary";
}

/**
 * Primary workspace navigation. Order + icons come from the exported sidebar
 * (aetheric_workstation_get_started / mobile_chat).
 */
export const navigation: NavItemConfig[] = [
  { label: "Chats", href: "/chat", icon: "chat", section: "primary" },
  { label: "Projects", href: "/projects", icon: "folder", section: "primary" },
  { label: "Tasks", href: "/tasks", icon: "task_alt", section: "primary" },
  { label: "Agents", href: "/agents", icon: "smart_toy", section: "primary" },
  { label: "Files", href: "/files", icon: "description", section: "primary" },
  { label: "Sources", href: "/sources", icon: "menu_book", section: "primary" },
  { label: "Tools", href: "/tools", icon: "construction", section: "primary" },
  { label: "Activity", href: "/activity", icon: "analytics", section: "primary" },
  { label: "Settings", href: "/settings", icon: "settings", section: "secondary" },
  { label: "Help", href: "/help", icon: "help", section: "secondary" },
];

/** Links shown in the desktop top app bar. */
export const topBarLinks = [{ label: "Capabilities", href: "/tools" }];
