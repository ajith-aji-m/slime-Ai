"use client";

import type { CanvasArtifact } from "@/types/canvas";
import { CodeCanvas } from "./code-canvas";
import { HtmlCanvas } from "./html-canvas";
import { TableCanvas } from "./table-canvas";
import { ReportCanvas } from "./report-canvas";
import { ImageCanvas } from "./image-canvas";

/** Routes an artifact to its type-specific Canvas view. */
export function CanvasContent({ artifact }: { artifact: CanvasArtifact }) {
  switch (artifact.type) {
    case "code":
      return <CodeCanvas artifact={artifact} />;
    case "html":
      return <HtmlCanvas artifact={artifact} />;
    case "table":
      return <TableCanvas artifact={artifact} />;
    case "report":
      return <ReportCanvas artifact={artifact} />;
    case "image":
      return <ImageCanvas artifact={artifact} />;
    default:
      return null;
  }
}
