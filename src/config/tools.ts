import type { ToolId } from "@/types/chat";
import type { IconName } from "@/components/ui/icon";

export interface ToolConfig {
  id: ToolId;
  label: string;
  icon: IconName;
  description: string;
  /** shown in the composer tool strip */
  inComposer: boolean;
  /**
   * A "mode" tool drives the whole request — the internal router picks the
   * NVIDIA model for it and the UI applies its accent. Only one mode tool can
   * be active at a time; toggling one on turns the others off. Non-mode tools
   * (e.g. file analysis) are independent add-ons.
   */
  mode?: boolean;
}

/** Composer tool strip: Search · Code · Image Gen · Research · Humanizer. */
export const tools: ToolConfig[] = [
  {
    id: "web_search",
    label: "Search",
    icon: "search",
    description: "Search the web and cite sources.",
    inComposer: true,
    mode: true,
  },
  {
    id: "code",
    label: "Code",
    icon: "terminal",
    description: "Run code and return the output.",
    inComposer: true,
    mode: true,
  },
  {
    id: "image_gen",
    label: "Image Gen",
    icon: "image",
    description: "Generate images from a prompt.",
    inComposer: true,
    mode: true,
  },
  {
    id: "research",
    label: "Research",
    icon: "library_books",
    description: "Deep multi-step research with a written report.",
    inComposer: true,
    mode: true,
  },
  {
    id: "humanizer",
    label: "Humanizer",
    icon: "draw",
    description:
      "Rewrite AI-generated text to sound natural — with a highlighted, keyword-checked preview in Canvas.",
    inComposer: true,
    mode: true,
  },
  {
    id: "file_analysis",
    label: "File analysis",
    icon: "description",
    description: "Analyse uploaded files for context.",
    inComposer: false,
  },
];

export const toolsById = Object.fromEntries(tools.map((t) => [t.id, t])) as Record<
  ToolId,
  ToolConfig
>;

/** The mutually-exclusive "mode" tools, in composer display order. */
export const MODE_TOOL_IDS: ToolId[] = tools.filter((t) => t.mode).map((t) => t.id);

/** The single active mode in a tool list, if any (there's ever at most one). */
export function activeModeTool(active: ToolId[]): ToolId | undefined {
  return active.find((id) => toolsById[id]?.mode);
}
