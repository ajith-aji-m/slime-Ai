import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { SettingsView } from "@/components/settings/settings-view";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <WorkspacePage
      title="Settings"
      description="Profile, appearance and local data."
      width="narrow"
    >
      <SettingsView />
    </WorkspacePage>
  );
}
