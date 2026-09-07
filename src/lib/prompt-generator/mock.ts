/**
 * Offline heuristic used only by the built-in mock provider (no
 * `NVIDIA_API_KEY`). Turns a rough idea into a templated, structured prompt
 * via keyword-based branching — deliberately conservative, same spirit as
 * `mockHumanize`, so the Prompt Generator has a real, useful offline result
 * without a network call. When a real model is configured, the routed model
 * writes the prompt instead (see `PROMPT_GENERATOR_SYSTEM_PROMPT`).
 */

interface Domain {
  test: RegExp;
  role: string;
  task: string;
  constraints: string[];
  outputFormat: string;
}

const DOMAINS: Domain[] = [
  {
    test: /\bcode|function|script|api|bug|debug|refactor|algorithm\b/i,
    role:
      "You are a senior software engineer with deep experience writing production-quality code.",
    task:
      "Write working, well-structured code that solves the request below, with brief inline comments only where the logic isn't obvious.",
    constraints: [
      "Include realistic error handling, not just the happy path.",
      "State any assumptions about the language, framework, or version.",
    ],
    outputFormat:
      "A single code block, followed by a short paragraph explaining the approach.",
  },
  {
    test: /\bemail|blog|article|copy|marketing|social media|caption|newsletter\b/i,
    role:
      "You are an experienced copywriter who writes clear, persuasive, natural-sounding prose.",
    task: "Write copy that directly addresses the request below in an engaging, natural voice.",
    constraints: [
      "Match a tone appropriate for the intended audience.",
      "Vary sentence length and rhythm — avoid repetitive structure.",
    ],
    outputFormat: "Ready-to-use copy, formatted for where it will be published.",
  },
  {
    test: /\bresearch|analy[sz]e|report|summar|breakdown|trend|data\b/i,
    role: "You are a meticulous research analyst who backs claims with clear reasoning.",
    task: "Research and summarize the request below, explaining the reasoning behind each conclusion.",
    constraints: [
      "Distinguish clearly between established fact and inference.",
      "Flag any point where more data would change the conclusion.",
    ],
    outputFormat: "Well-structured Markdown with headings, and a table if the data is tabular.",
  },
  {
    test: /\bdesign|image|logo|illustration|visual|mockup|ui\b/i,
    role: "You are a skilled visual designer with a strong eye for composition and detail.",
    task:
      "Describe a detailed visual concept for the request below, precise enough to hand to a designer or image model.",
    constraints: [
      "Specify composition, color palette, and mood explicitly.",
      "Call out the single most important focal element.",
    ],
    outputFormat: "A structured description — subject, style, composition, palette, mood.",
  },
  {
    test: /\blesson|teach|explain|tutorial|learn|beginner\b/i,
    role: "You are a patient, clear teacher who explains complex ideas simply.",
    task: "Explain the topic below step by step, starting from first principles.",
    constraints: [
      "Define any jargon the first time it's used.",
      "Use a concrete example to anchor each abstract point.",
    ],
    outputFormat: "Numbered steps or short sections, building from basics to the full picture.",
  },
];

const DEFAULT_DOMAIN: Domain = {
  role: "You are a knowledgeable, careful assistant.",
  task: "Complete the request below thoroughly and accurately.",
  constraints: [
    "Be specific and concrete — avoid generic filler and hedging.",
    "Ask for missing details only if the task genuinely can't proceed without them.",
  ],
  outputFormat: "Well-structured Markdown with headings where useful.",
  test: /$^/, // never matches; only reached as the fallback
};

function pickDomain(idea: string): Domain {
  return DOMAINS.find((d) => d.test.test(idea)) ?? DEFAULT_DOMAIN;
}

/** Build the structured prompt. Returns "" for empty input, like `mockHumanize`. */
export function mockGeneratePrompt(idea: string): string {
  const trimmed = idea.trim();
  if (!trimmed) return trimmed;

  const domain = pickDomain(trimmed);
  const context = trimmed.length > 400 ? `${trimmed.slice(0, 397)}…` : trimmed;

  return [
    "## Role",
    domain.role,
    "",
    "## Context",
    context,
    "",
    "## Task",
    domain.task,
    "",
    "## Constraints",
    ...domain.constraints.map((c) => `- ${c}`),
    "",
    "## Output format",
    domain.outputFormat,
  ].join("\n");
}
