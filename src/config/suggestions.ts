import type { IconName } from "@/components/ui/icon";
import type { ToolId } from "@/types/chat";

export type SuggestionAccent = "purple" | "green" | "blue" | "amber";

export interface Suggestion {
  title: string;
  description: string;
  icon: IconName;
  /** tint used for the icon tile on the welcome card */
  accent: SuggestionAccent;
  prompt: string;
  tool?: ToolId;
}

/** Welcome-screen suggestion grid — from the exported "Get Started" screen. */
export const suggestions: Suggestion[] = [
  {
    title: "Deep Research",
    description: "Synthesize papers, reports and web sources.",
    icon: "science",
    accent: "purple",
    prompt:
      "Run deep research on the current state of open-weight AI models and summarise the key findings with sources.",
    tool: "research",
  },
  {
    title: "Code Generation",
    description: "Build & debug code across the stack.",
    icon: "code_blocks",
    accent: "green",
    prompt:
      "Write a production-ready React hook for managing a reconnecting websocket connection, with TypeScript types.",
    tool: "code",
  },
  {
    title: "Creative Writing",
    description: "Draft engaging content, blogs, and documents.",
    icon: "draw",
    accent: "blue",
    prompt:
      "Draft an engaging product announcement blog post for a new AI workstation called Slime AI.",
  },
  {
    title: "Data Analysis",
    description: "Surface trends and insights from your data.",
    icon: "insights",
    accent: "amber",
    prompt:
      "Analyse our Q3 user engagement metrics and generate a breakdown of the key trends with a summary table.",
    tool: "file_analysis",
  },
];
