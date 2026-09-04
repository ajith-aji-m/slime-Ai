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
   * Composer placeholder shown while this tool is the active mode. Only
   * meaningful for `mode` tools — falls back to the generic
   * "Message {site.shortName}…" placeholder when unset.
   */
  placeholder?: string;
  /**
   * A "mode" tool drives the whole request — the internal router picks the
   * NVIDIA model for it and the UI applies its accent. Only one mode tool can
   * be active at a time; toggling one on turns the others off. Non-mode tools
   * (e.g. file analysis) are independent add-ons.
   */
  mode?: boolean;
}

/**
 * Composer tool strip: Search · Code · Research · Humanizer.
 *
 * `image_gen` is intentionally omitted for now — no NVIDIA image model is wired
 * up, so it's hidden from every UI surface. The routing/detection code still
 * understands the `"image_gen"` id, so restoring it is just re-adding the entry
 * below.
 */
export const tools: ToolConfig[] = [
  {
    id: "web_search",
    label: "Search",
    icon: "search",
    description: "Search the web and cite sources.",
    inComposer: true,
    mode: true,
    placeholder: "Search the web…",
  },
  {
    id: "code",
    label: "Code",
    icon: "terminal",
    description: "Run code and return the output.",
    inComposer: true,
    mode: true,
    placeholder: "Describe what you want to build or debug…",
  },
  // {
  //   id: "image_gen",
  //   label: "Image Gen",
  //   icon: "image",
  //   description: "Generate images from a prompt.",
  //   inComposer: true,
  //   mode: true,
  //   placeholder: "Describe the image you want to generate…",
  // },
  {
    id: "research",
    label: "Research",
    icon: "library_books",
    description: "Deep multi-step research with a written report.",
    inComposer: true,
    mode: true,
    placeholder: "What do you want to research?",
  },
  {
    id: "humanizer",
    label: "Humanizer",
    icon: "draw",
    description:
      "Rewrite AI-generated text to sound natural — with a highlighted, keyword-checked preview in Canvas.",
    inComposer: true,
    mode: true,
    placeholder: "Paste the content you want to humanize…",
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
