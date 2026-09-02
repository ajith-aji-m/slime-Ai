import type { Metadata } from "next";
import Link from "next/link";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Avatar, Button, Card, Chip } from "@/components/ui";
import { mockAgents } from "@/data/workspace";

export const metadata: Metadata = { title: "Agents" };

export default function AgentsPage() {
  return (
    <WorkspacePage
      title="Agents"
      description="Reusable assistants with their own tools and instructions."
      actions={
        <Button size="sm" iconLeft="add">
          New agent
        </Button>
      }
      width="wide"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockAgents.map((agent) => (
          <Card key={agent.id} interactive className="p-5">
            <Link href={`/agents/${agent.id}`} className="block">
              <div className="mb-3 flex items-center justify-between">
                <Avatar name={agent.name} icon={agent.icon} brand size={36} />
                <Chip tone={agent.status === "active" ? "success" : "neutral"}>
                  {agent.status}
                </Chip>
              </div>
              <h3 className="text-sm font-semibold text-on-surface">
                {agent.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-on-surface-variant">
                {agent.description}
              </p>
              <p className="mt-4 text-xs text-on-surface-variant">
                {agent.runs} runs
              </p>
            </Link>
          </Card>
        ))}
      </div>
    </WorkspacePage>
  );
}
