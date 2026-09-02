import type { IconName } from "@/components/ui/icon";

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  conversationCount: number;
  fileCount: number;
  updatedAt: string;
}

export type TaskStatus = "todo" | "in_progress" | "review" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  projectId?: string;
  assignee: "you" | "agent";
  dueDate?: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: IconName;
  tools: string[];
  status: "active" | "draft" | "paused";
  runs: number;
}

export interface WorkspaceFile {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  addedAt: string;
  projectId?: string;
  status: "ready" | "processing" | "error";
}

export interface Source {
  id: string;
  title: string;
  kind: "web" | "connector" | "dataset" | "repo";
  detail: string;
  icon: IconName;
  connected: boolean;
}

export interface ActivityEvent {
  id: string;
  kind: "model" | "tool" | "file" | "agent" | "system";
  title: string;
  detail: string;
  timestamp: string;
  icon: IconName;
}
