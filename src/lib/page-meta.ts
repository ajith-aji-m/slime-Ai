import { navigation } from "@/config/navigation";
import { site } from "@/config/site";

/** Maps a pathname to the label shown in the top app bar. */
export function pageTitleFromPath(pathname: string): string {
  if (pathname === "/chat" || pathname === "/") return `${site.shortName} Workstation`;
  const match = navigation.find(
    (n) => pathname === n.href || pathname.startsWith(`${n.href}/`),
  );
  if (match) return match.label;
  if (pathname.startsWith("/models")) return "Model Selector";
  return `${site.shortName} Workstation`;
}

/** Chat routes get the 3-pane layout with the Intelligence panel. */
export function isChatRoute(pathname: string): boolean {
  return pathname === "/chat" || pathname.startsWith("/chat/");
}
