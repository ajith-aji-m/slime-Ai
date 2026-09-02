import type { Metadata } from "next";
import { WorkspacePage } from "@/components/layout/workspace-page";
import { ModelCatalogue } from "@/components/models/model-catalogue";

export const metadata: Metadata = { title: "Model Selector" };

export default function ModelsPage() {
  return (
    <WorkspacePage
      title="Model Selector"
      description="Choose the default model for new conversations. Providers connect later — responses are mocked for now."
      width="wide"
    >
      <ModelCatalogue />
    </WorkspacePage>
  );
}
