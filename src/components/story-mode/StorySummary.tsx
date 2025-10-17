"use client";

import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useStoryModeStore } from "@/stores/storyModeStore";

export function StorySummary({ stepId }: { stepId: string }) {
  const steps = useStoryModeStore((state) => state.steps);
  const completeStep = useStoryModeStore((state) => state.completeStep);

  const summary = useMemo(() => {
    const lines: string[] = [];
    if (steps["image-generation"]?.data?.imageUrl) {
      lines.push(`Generated NovaMind logo: ${steps["image-generation"].data?.imageUrl}`);
    }
    if (steps["structured-output"]?.output) {
      lines.push("Drafted JSON PII redaction policy leveraging structured outputs.");
    }
    if (steps["knowledge-assistant"]?.output) {
      lines.push("Validated uploaded references with the knowledge assistant.");
    }
    if (steps["realtime-assistant"]?.output) {
      lines.push("Recorded and transcribed a PII process voiceover.");
    }
    if (steps["support-bot"]?.output) {
      lines.push("Simulated a customer privacy support exchange.");
    }
    return lines.length ? lines : ["Capture at least one output in the previous steps to populate the summary."];
  }, [steps]);

  const markdown = useMemo(() => {
    const header = "# NovaMind Story Mode Summary";
    const bullets = summary.map((line) => `- ${line}`).join("\n");
    const detail = `\n\n## Step details\n${Object.entries(steps)
      .map(([id, data]) => {
        const payload = JSON.stringify(data, null, 2);
        return `### ${id}\n\n\`\`\`json\n${payload}\n\`\`\``;
      })
      .join("\n\n")}`;
    return `${header}\n\n${bullets}${detail}`;
  }, [steps, summary]);

  const jsonExport = useMemo(
    () => JSON.stringify({ steps }, null, 2),
    [steps]
  );

  useEffect(() => {
    completeStep(stepId, {
      output: summary.join("\n"),
      data: {
        summary,
        markdown,
        json: jsonExport
      }
    });
  }, [completeStep, jsonExport, markdown, stepId, summary]);

  function downloadFile(filename: string, content: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="text-sm font-semibold text-neutral-800">Key takeaways</div>
        <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-neutral-700">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={() => downloadFile("novamind-story.md", markdown, "text/markdown")}>Export Markdown</Button>
        <Button onClick={() => downloadFile("novamind-story.json", jsonExport, "application/json")}>Export JSON</Button>
      </div>
    </div>
  );
}
