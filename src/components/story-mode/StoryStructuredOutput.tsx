"use client";

import { useEffect, useMemo, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { storyStepSelectors, useStoryModeStore } from "@/stores/storyModeStore";
import { PromptInjector } from "./PromptInjector";

export function StoryStructuredOutput({
  stepId,
  initialPrompt,
  dependsOn
}: {
  stepId: string;
  initialPrompt: string;
  dependsOn?: string[];
}) {
  const token = useAuthStore((s) => s.byokToken);
  const stepState = useStoryModeStore(storyStepSelectors.step(stepId));
  const setStepInput = useStoryModeStore((s) => s.setStepInput);
  const completeStep = useStoryModeStore((s) => s.completeStep);
  const dependencyData = useStoryModeStore((state) =>
    (dependsOn || []).map((dep) => ({ id: dep, state: state.steps[dep] }))
  );

  const prompt = stepState?.input ?? initialPrompt;

  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stepState) {
      setStepInput(stepId, initialPrompt);
    }
  }, [initialPrompt, setStepInput, stepId, stepState]);

  const prefilledContext = useMemo(() => {
    const logo = dependencyData.find((d) => d.id === "image-generation");
    const imageUrl = logo?.state?.data?.imageUrl as string | undefined;
    return {
      imageUrl
    };
  }, [dependencyData]);

  async function run() {
    if (!prompt.trim() || isRunning) return;
    if (!token) {
      setError("Add your OpenAI API key in Settings before generating policies.");
      return;
    }
    setError(null);
    setIsRunning(true);
    try {
      const system = prefilledContext.imageUrl
        ? `You are crafting a JSON redaction policy for NovaMind based on a newly designed logo available at ${prefilledContext.imageUrl}.`
        : "You are crafting a JSON redaction policy for NovaMind.";
      const res = await fetch("/api/structured/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OPENAI-KEY": token
        },
        body: JSON.stringify({
          sessionId: "story-structured",
          messages: [
            { role: "system", content: system },
            { role: "user", content: prompt }
          ],
          schemaId: "piiExtract",
          useTools: true
        })
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Structured output failed.");
      }
      const data = await res.json();
      const json = data.message?.json ?? data.message?.content;
      const serialized = typeof json === "string" ? json : JSON.stringify(json, null, 2);
      completeStep(stepId, {
        output: serialized,
        data: {
          policy: json,
          prompt,
          system
        }
      });
    } catch (err) {
      console.error("Story structured output failed", err);
      const message = err instanceof Error ? err.message : "Structured output failed.";
      setError(message);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      {prefilledContext.imageUrl ? (
        <PromptInjector
          label="NovaMind logo ready"
          description="The generated logo URL is available to reference inside your policy."
          value={
            <a
              className="text-blue-600 underline"
              href={prefilledContext.imageUrl}
              target="_blank"
              rel="noreferrer"
            >
              {prefilledContext.imageUrl}
            </a>
          }
          onUse={() => setStepInput(stepId, `${prompt}\n\nLogo reference: ${prefilledContext.imageUrl}`)}
        />
      ) : null}
      <div>
        <div className="text-sm font-medium text-neutral-800">Prompt</div>
        <Textarea
          value={prompt}
          onChange={(e) => setStepInput(stepId, e.target.value)}
          rows={5}
          placeholder="Describe the PII redaction policy you want to create…"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={run} disabled={!prompt.trim() || isRunning}>
            {isRunning ? "Generating…" : "Generate Policy"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
      {stepState?.output ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-900/90 p-4 text-green-100">
          <div className="text-sm font-semibold text-green-200">PII Redaction Policy (JSON)</div>
          <pre className="mt-3 max-h-80 overflow-auto text-xs text-green-100">{stepState.output}</pre>
        </div>
      ) : null}
    </div>
  );
}
