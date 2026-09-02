import { notFound } from "next/navigation";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Avatar, Button, Card, Chip } from "@/components/ui";
import { toolsById } from "@/config/tools";
import { mockAgents } from "@/data/workspace";
import type { ToolId } from "@/types/chat";

export default async function AgentDetailPage({
  params,
}: PageProps<"/agents/[agentId]">) {
  const { agentId } = await params;
  const agent = mockAgents.find((a) => a.id === agentId);
  if (!agent) notFound();

  return (
    <WorkspacePage
      title={agent.name}
      description={agent.role}
      actions={
        <Button size="sm" iconLeft="play_arrow">
          Run agent
        </Button>
      }
      width="narrow"
    >
      <Card className="p-5">
        <div className="flex items-center gap-3">
          <Avatar name={agent.name} icon={agent.icon} brand size={44} />
          <div>
            <p className="text-sm font-semibold text-on-surface">{agent.name}</p>
            <p className="text-xs text-on-surface-variant">{agent.role}</p>
          </div>
          <Chip
            tone={agent.status === "active" ? "success" : "neutral"}
            className="ml-auto"
          >
            {agent.status}
          </Chip>
        </div>

        <p className="mt-4 text-sm text-on-surface-variant">
          {agent.description}
        </p>

        <h3 className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
          Tools
        </h3>
        <div className="flex flex-wrap gap-2">
          {agent.tools.length === 0 ? (
            <span className="text-sm text-on-surface-variant">No tools</span>
          ) : (
            agent.tools.map((tool) => (
              <Chip key={tool} icon={toolsById[tool as ToolId]?.icon}>
                {toolsById[tool as ToolId]?.label ?? tool}
              </Chip>
            ))
          )}
        </div>
      </Card>
    </WorkspacePage>
  );
}
