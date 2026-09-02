import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Button, Card, Chip, Icon } from "@/components/ui";
import { mockTasks } from "@/data/workspace";
import type { TaskStatus } from "@/types/workspace";

export const metadata: Metadata = { title: "Tasks" };

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "in_progress", label: "In progress" },
  { status: "review", label: "Review" },
  { status: "done", label: "Done" },
];

export default function TasksPage() {
  return (
    <WorkspacePage
      title="Tasks"
      description="Work you or an agent is running across the workspace."
      actions={
        <Button size="sm" iconLeft="add">
          New task
        </Button>
      }
      width="wide"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {COLUMNS.map((column) => {
          const items = mockTasks.filter((t) => t.status === column.status);
          return (
            <section key={column.status} className="flex flex-col gap-3">
              <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {column.label}
                <span className="rounded-full bg-surface-container-high px-1.5 text-[11px]">
                  {items.length}
                </span>
              </h3>
              {items.map((task) => (
                <Card key={task.id} className="p-3">
                  <p className="text-sm text-on-surface">{task.title}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
                    <Icon
                      name={task.assignee === "agent" ? "smart_toy" : "person"}
                      size={14}
                    />
                    {task.assignee === "agent" ? "Agent" : "You"}
                    {task.dueDate ? (
                      <Chip className="ml-auto">Due {task.dueDate}</Chip>
                    ) : null}
                  </div>
                </Card>
              ))}
            </section>
          );
        })}
      </div>
    </WorkspacePage>
  );
}
