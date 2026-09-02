import type { Agent, Project, Task } from "@/types/workspace";

export const mockProjects: Project[] = [
  {
    id: "p_q3",
    name: "Q3 Financial Review",
    description: "Revenue analysis, board brief and forecast modelling.",
    color: "#630ed4",
    conversationCount: 8,
    fileCount: 5,
    updatedAt: "2026-09-01T16:00:00.000Z",
  },
  {
    id: "p_platform",
    name: "Platform Launch",
    description: "Go-to-market copy, docs and launch-day runbook.",
    color: "#03b5d3",
    conversationCount: 14,
    fileCount: 11,
    updatedAt: "2026-08-28T11:30:00.000Z",
  },
  {
    id: "p_research",
    name: "Model Research",
    description: "Ongoing evaluation of open-weight and hosted models.",
    color: "#ae397b",
    conversationCount: 21,
    fileCount: 3,
    updatedAt: "2026-09-02T08:15:00.000Z",
  },
];

export const mockTasks: Task[] = [
  {
    id: "t1",
    title: "Summarise Q3 revenue by segment",
    status: "done",
    projectId: "p_q3",
    assignee: "agent",
    updatedAt: "2026-09-01T10:00:00.000Z",
  },
  {
    id: "t2",
    title: "Draft board brief from the analysis",
    status: "in_progress",
    projectId: "p_q3",
    assignee: "you",
    dueDate: "2026-09-04",
    updatedAt: "2026-09-02T09:00:00.000Z",
  },
  {
    id: "t3",
    title: "Benchmark Llama 3.3 vs GPT-4o on our eval set",
    status: "todo",
    projectId: "p_research",
    assignee: "agent",
    updatedAt: "2026-09-02T07:00:00.000Z",
  },
  {
    id: "t4",
    title: "Review launch-day runbook",
    status: "review",
    projectId: "p_platform",
    assignee: "you",
    dueDate: "2026-09-03",
    updatedAt: "2026-08-30T15:00:00.000Z",
  },
];

export const mockAgents: Agent[] = [
  {
    id: "a_analyst",
    name: "Data Analyst",
    role: "Analysis",
    description: "Parses spreadsheets and reports, returns summaries with tables.",
    icon: "insights",
    tools: ["file_analysis", "code"],
    status: "active",
    runs: 42,
  },
  {
    id: "a_researcher",
    name: "Researcher",
    role: "Research",
    description: "Runs multi-step web research and writes cited briefs.",
    icon: "science",
    tools: ["web_search", "research"],
    status: "active",
    runs: 28,
  },
  {
    id: "a_writer",
    name: "Editor",
    role: "Writing",
    description: "Drafts and edits long-form copy in the house style.",
    icon: "draw",
    tools: [],
    status: "draft",
    runs: 5,
  },
];
