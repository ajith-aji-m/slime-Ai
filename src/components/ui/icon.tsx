import { cn } from "@/lib/utils/cn";

/**
 * Every Material Symbols glyph used in the product. Adding one here keeps the
 * set discoverable (and is the list a future font-subset step reads from).
 */
export const ICON_NAMES = [
  "add",
  "add_circle",
  "analytics",
  "api",
  "article",
  "arrow_back",
  "arrow_upward",
  "attach_file",
  "auto_awesome",
  "bolt",
  "calendar_today",
  "chat",
  "check",
  "check_circle",
  "chevron_left",
  "chevron_right",
  "close",
  "cloud",
  "cloud_done",
  "code",
  "code_blocks",
  "construction",
  "content_copy",
  "database",
  "delete",
  "delete_sweep",
  "description",
  "done",
  "download",
  "draw",
  "edit",
  "expand_more",
  "extension",
  "filter_list",
  "folder",
  "folder_open",
  "graphic_eq",
  "grid_view",
  "group",
  "help",
  "history",
  "hub",
  "image",
  "insights",
  "keyboard_arrow_down",
  "library_books",
  "link",
  "logout",
  "memory",
  "menu",
  "menu_book",
  "mic",
  "more_horiz",
  "notifications",
  "open_in_new",
  "pause",
  "person",
  "play_arrow",
  "psychology",
  "refresh",
  "schedule",
  "science",
  "search",
  "send",
  "settings",
  "share",
  "smart_toy",
  "sort",
  "space_dashboard",
  "star",
  "stop",
  "table_chart",
  "task_alt",
  "terminal",
  "thumb_down",
  "thumb_up",
  "tune",
  "upload",
  "view_list",
  "visibility",
  "web",
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: IconName;
  /** filled vs outlined variant */
  filled?: boolean;
  /** optical size in px; also sets the rendered font-size */
  size?: number;
}

/**
 * Thin wrapper over the self-hosted Material Symbols font. Decorative by
 * default (`aria-hidden`); pass `role="img"` + `aria-label` for meaningful icons.
 */
export function Icon({
  name,
  filled = false,
  size = 20,
  className,
  style,
  "aria-label": ariaLabel,
  ...rest
}: IconProps) {
  return (
    <span
      className={cn("material-symbol shrink-0 select-none", className)}
      data-fill={filled ? "true" : undefined}
      aria-hidden={ariaLabel ? undefined : true}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      style={{ fontSize: size, width: size, height: size, ...style }}
      {...rest}
    >
      {name}
    </span>
  );
}
