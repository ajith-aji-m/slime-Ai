import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { Card, Icon } from "@/components/ui";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Help" };

const TOPICS = [
  {
    icon: "chat" as const,
    title: "Conversations",
    body: "Start a chat from the welcome screen or the New Chat button. History is saved on this device and listed under Recents.",
  },
  {
    icon: "construction" as const,
    title: "Tools",
    body: "Enable Search, Code, Image Gen or Research from the composer to change how the assistant responds.",
  },
  {
    icon: "auto_awesome" as const,
    title: "Models",
    body: "Pick a default model in Model Selector. Real providers connect in a later release — responses are currently mocked.",
  },
  {
    icon: "cloud" as const,
    title: "Your data",
    body: "Everything is local-first. Manage retention and clear history from Settings.",
  },
];

export default function HelpPage() {
  return (
    <WorkspacePage
      title="Help"
      description={`How ${site.name} works.`}
      width="narrow"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <Card key={topic.title} className="p-5">
            <Icon name={topic.icon} size={20} className="mb-2 text-primary" />
            <h3 className="text-sm font-semibold text-on-surface">
              {topic.title}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">{topic.body}</p>
          </Card>
        ))}
      </div>
    </WorkspacePage>
  );
}
