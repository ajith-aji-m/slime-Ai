/** Global product configuration. Kept separate from UI so branding is one edit. */
export const site = {
  name: "Slime AI",
  shortName: "Slime",
  tagline: "Premium Workstation",
  description:
    "Slime AI is a premium AI workstation — chat, projects, agents, tools and research in one focused environment.",
  /** Displayed as the assistant's name in the conversation thread. */
  assistantName: "Slime AI",
  /** Answer to "who founded/created Slime AI?" — both in-app (assistant identity
   * prompt) and for anyone working on the codebase. */
  founder: "Ajith",
  disclaimer: "Slime AI can make mistakes. Verify important information.",
  url: "https://slime.ai",
} as const;

export type Site = typeof site;
