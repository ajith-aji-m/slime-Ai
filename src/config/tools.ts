import type { ToolId } from "@/types/chat";
import type { IconName } from "@/components/ui/icon";

export interface ToolConfig {
  id: ToolId;
  label: string;
  icon: IconName;
  description: string;
  /** shown in the composer tool strip */
  inComposer: boolean;
}

/** Tool strip in the exported composer: Search · Code · Image Gen · Research. */
export const tools: ToolConfig[] = [
  {
    id: "web_search",
    label: "Search",
    icon: "search",
    description: "Search the web and cite sources.",
    inComposer: true,
  },
  {
    id: "code",
    label: "Code",
    icon: "terminal",
    description: "Run code and return the output.",
    inComposer: true,
  },
  {
    id: "image_gen",
    label: "Image Gen",
    icon: "image",
    description: "Generate images from a prompt.",
    inComposer: true,
  },
  {
    id: "research",
    label: "Research",
    icon: "library_books",
    description: "Deep multi-step research with a written report.",
    inComposer: true,
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
