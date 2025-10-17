"use client";

import { ReactNode } from "react";
import { StoryImageGenerator } from "@/components/story-mode/StoryImageGenerator";
import { StoryStructuredOutput } from "@/components/story-mode/StoryStructuredOutput";
import { StoryKnowledgeAssistant } from "@/components/story-mode/StoryKnowledgeAssistant";
import { StoryRealtimeRecorder } from "@/components/story-mode/StoryRealtimeRecorder";
import { StorySupportChat } from "@/components/story-mode/StorySupportChat";
import { StorySummary } from "@/components/story-mode/StorySummary";

export type DemoStep = {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
  featureComponent: ReactNode;
  dependsOn?: string[];
};

export const demoSteps: DemoStep[] = [
  {
    id: "image-generation",
    title: "Step 1 — Image Generation",
    description: "Design NovaMind's new brand identity with a generated logo.",
    initialPrompt: "Design a modern, tech-savvy logo for a new AI startup called NovaMind.",
    featureComponent: <StoryImageGenerator stepId="image-generation" initialPrompt="Design a modern, tech-savvy logo for a new AI startup called NovaMind." />
  },
  {
    id: "structured-output",
    title: "Step 2 — Structured Output",
    description: "Turn the branding work into a JSON redaction policy.",
    initialPrompt: "Use the NovaMind branding and create a JSON PII redaction policy that our assistants can follow.",
    dependsOn: ["image-generation"],
    featureComponent: (
      <StoryStructuredOutput
        stepId="structured-output"
        initialPrompt="Use the NovaMind branding and create a JSON PII redaction policy that our assistants can follow."
        dependsOn={["image-generation"]}
      />
    )
  },
  {
    id: "knowledge-assistant",
    title: "Step 3 — Knowledge Assistant",
    description: "Reference internal PDFs to confirm compliance guidance exists.",
    initialPrompt: "Does this uploaded PDF contain PII handling guidelines?",
    dependsOn: ["structured-output"],
    featureComponent: (
      <StoryKnowledgeAssistant
        stepId="knowledge-assistant"
        initialPrompt="Does this uploaded PDF contain PII handling guidelines?"
        dependsOn={["structured-output"]}
      />
    )
  },
  {
    id: "realtime-assistant",
    title: "Step 4 — Realtime Voiceover",
    description: "Record a voiceover explaining NovaMind's approach to PII.",
    initialPrompt: "Narrate how NovaMind processes and protects customer PII in under 30 seconds.",
    dependsOn: ["knowledge-assistant"],
    featureComponent: (
      <StoryRealtimeRecorder
        stepId="realtime-assistant"
        initialPrompt="Narrate how NovaMind processes and protects customer PII in under 30 seconds."
        dependsOn={["knowledge-assistant"]}
      />
    )
  },
  {
    id: "support-bot",
    title: "Step 5 — Support Chat",
    description: "Simulate a customer privacy question using the support bot.",
    initialPrompt: "How does NovaMind handle customer data privacy?",
    dependsOn: ["realtime-assistant"],
    featureComponent: (
      <StorySupportChat
        stepId="support-bot"
        initialPrompt="How does NovaMind handle customer data privacy?"
        dependsOn={["realtime-assistant"]}
      />
    )
  },
  {
    id: "story-summary",
    title: "Step 6 — Wrap Up",
    description: "Review key outputs and export your NovaMind narrative.",
    initialPrompt: "",
    dependsOn: ["image-generation", "structured-output", "knowledge-assistant", "realtime-assistant", "support-bot"],
    featureComponent: <StorySummary stepId="story-summary" />
  }
];
