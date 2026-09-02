import { notFound } from "next/navigation";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Card, Chip, Icon } from "@/components/ui";
import { mockProjects, mockTasks } from "@/data/workspace";

export default async function ProjectDetailPage({
  params,
}: PageProps<"/projects/[projectId]">) {
  const { projectId } = await params;
  const project = mockProjects.find((p) => p.id === projectId);
  if (!project) notFound();

  const tasks = mockTasks.filter((t) => t.projectId === project.id);

  return (
    <WorkspacePage title={project.name} description={project.description}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-on-surface-variant">Conversations</p>
          <p className="mt-1 text-2xl font-semibold text-on-surface">
            {project.conversationCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-on-surface-variant">Files</p>
          <p className="mt-1 text-2xl font-semibold text-on-surface">
            {project.fileCount}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-on-surface-variant">Open tasks</p>
          <p className="mt-1 text-2xl font-semibold text-on-surface">
            {tasks.filter((t) => t.status !== "done").length}
          </p>
        </Card>
      </div>

      <h3 className="mb-3 mt-8 text-sm font-semibold text-on-surface">Tasks</h3>
      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="flex items-center gap-3 p-3">
            <Icon
              name={task.status === "done" ? "check_circle" : "schedule"}
              size={18}
              className={
                task.status === "done" ? "text-success" : "text-on-surface-variant"
              }
            />
            <span className="flex-1 text-sm text-on-surface">{task.title}</span>
            <Chip>{task.status.replace("_", " ")}</Chip>
          </Card>
        ))}
      </div>
    </WorkspacePage>
  );
}
