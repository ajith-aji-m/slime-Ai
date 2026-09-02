import type { Metadata } from "next";
import Link from "next/link";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Button, Card, Icon } from "@/components/ui";
import { formatRelativeTime } from "@/lib/utils/format";
import { mockProjects } from "@/data/workspace";

export const metadata: Metadata = { title: "Projects" };

export default function ProjectsPage() {
  return (
    <WorkspacePage
      title="Projects"
      description="Group conversations, files and tasks around a goal."
      actions={
        <Button size="sm" iconLeft="add">
          New project
        </Button>
      }
      width="wide"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockProjects.map((project) => (
          <Card key={project.id} interactive className="p-5">
            <Link href={`/projects/${project.id}`} className="block">
              <span
                className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg text-white"
                style={{ backgroundColor: project.color }}
              >
                <Icon name="folder" filled size={18} />
              </span>
              <h3 className="text-sm font-semibold text-on-surface">
                {project.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                {project.description}
              </p>
              <div className="mt-4 flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1">
                  <Icon name="chat" size={14} />
                  {project.conversationCount}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Icon name="description" size={14} />
                  {project.fileCount}
                </span>
                <span className="ml-auto">
                  {formatRelativeTime(project.updatedAt)}
                </span>
              </div>
            </Link>
          </Card>
        ))}
      </div>
    </WorkspacePage>
  );
}
