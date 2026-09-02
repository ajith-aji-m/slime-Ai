import type { ActivityEvent, Source, WorkspaceFile } from "@/types/workspace";

export const mockFiles: WorkspaceFile[] = [
  {
    id: "f_q3",
    name: "Q3_Metrics_Final.pdf",
    mimeType: "application/pdf",
    size: 2_517_000,
    addedAt: "2026-08-30T09:12:00.000Z",
    status: "ready",
  },
  {
    id: "f_raw",
    name: "q3_metrics_raw.csv",
    mimeType: "text/csv",
    size: 486_000,
    addedAt: "2026-08-30T09:10:00.000Z",
    status: "ready",
  },
];

export const mockSources: Source[] = [
  {
    id: "s_web",
    title: "Web search",
    kind: "web",
    detail: "Live results with citations",
    icon: "search",
    connected: true,
  },
  {
    id: "s_drive",
    title: "Google Drive",
    kind: "connector",
    detail: "Not connected",
    icon: "folder_open",
    connected: false,
  },
  {
    id: "s_repo",
    title: "GitHub",
    kind: "repo",
    detail: "Not connected",
    icon: "hub",
    connected: false,
  },
];

export const mockActivity: ActivityEvent[] = [
  {
    id: "a1",
    kind: "model",
    title: "Slime Core responded",
    detail: "Q3 revenue breakdown · 1,240 tokens",
    timestamp: "2026-09-02T10:25:00.000Z",
    icon: "psychology",
  },
  {
    id: "a2",
    kind: "tool",
    title: "Web search ran",
    detail: "4 results for “open-weight model benchmarks”",
    timestamp: "2026-09-02T10:24:00.000Z",
    icon: "search",
  },
  {
    id: "a3",
    kind: "file",
    title: "File added to context",
    detail: "Q3_Metrics_Final.pdf",
    timestamp: "2026-09-02T09:12:00.000Z",
    icon: "description",
  },
];
