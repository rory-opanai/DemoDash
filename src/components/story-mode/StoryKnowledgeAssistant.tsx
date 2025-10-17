"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { storyStepSelectors, useStoryModeStore } from "@/stores/storyModeStore";
import { PromptInjector } from "./PromptInjector";

interface UploadedFile {
  fileId: string;
  name: string;
  bytes: number;
  createdAt: string;
}

export function StoryKnowledgeAssistant({
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

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [corpusId] = useState(() => `story_corpus_${Math.random().toString(36).slice(2, 8)}`);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const policyStep = useMemo(() => dependencyData.find((d) => d.id === "structured-output"), [dependencyData]);
  const policyJson = policyStep?.state?.output;

  useEffect(() => {
    if (!stepState) {
      setStepInput(stepId, initialPrompt);
    }
  }, [initialPrompt, setStepInput, stepId, stepState]);

  async function upload(list: FileList) {
    if (!token) {
      setError("Add your OpenAI API key in Settings before uploading files.");
      return;
    }
    const fd = new FormData();
    Array.from(list).forEach((file) => fd.append("files", file));
    setIsLoading(true);
    try {
      const res = await fetch("/api/files/upload", {
        method: "POST",
        headers: { "X-OPENAI-KEY": token },
        body: fd
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "File upload failed.");
      }
      const data = await res.json();
      setFiles((prev) => [...prev, ...(data.items as UploadedFile[])]);
      setError(null);
    } catch (err) {
      console.error("Story knowledge upload failed", err);
      const message = err instanceof Error ? err.message : "File upload failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  async function ask() {
    if (!prompt.trim()) return;
    if (!token) {
      setError("Add your OpenAI API key in Settings before asking questions.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const messages = [] as Array<{ role: string; content: string }>;
      if (policyJson) {
        messages.push({ role: "system", content: `Use this policy as context: ${policyJson}` });
      }
      messages.push({ role: "user", content: prompt });
      const res = await fetch("/api/knowledge/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OPENAI-KEY": token
        },
        body: JSON.stringify({
          sessionId: "story-knowledge",
          corpusId,
          tone: "precise",
          guardrails: false,
          fileIds: files.map((f) => f.fileId),
          messages
        })
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Knowledge assistant failed.");
      }
      const data = await res.json();
      const answer = data.message?.content ?? "(no answer)";
      completeStep(stepId, {
        output: answer,
        data: {
          answer,
          citations: data.message?.citations,
          files,
          prompt,
          policyJson
        }
      });
    } catch (err) {
      console.error("Story knowledge assistant failed", err);
      const message = err instanceof Error ? err.message : "Knowledge assistant failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {policyJson ? (
        <PromptInjector
          label="Structured policy available"
          description="Inject the redaction policy into your knowledge question for instant grounding."
          value={<pre className="max-h-36 overflow-auto text-xs">{policyJson}</pre>}
          onUse={() => setStepInput(stepId, `${prompt}\n\nPolicy reference: ${policyJson}`)}
        />
      ) : null}
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="text-sm font-medium text-neutral-800">Reference Material</div>
        <p className="mt-2 text-sm text-neutral-600">
          Upload a PDF or knowledge file to search for NovaMind&apos;s privacy handling details.
        </p>
        <div className="mt-3">
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(event) => event.target.files && upload(event.target.files)}
          />
          {files.length ? (
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              {files.map((file) => (
                <li key={file.fileId} className="flex justify-between">
                  <span>{file.name}</span>
                  <span className="text-neutral-500">{Math.round(file.bytes / 1024)} KB</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-neutral-800">Question</div>
        <Textarea
          value={prompt}
          rows={4}
          onChange={(e) => setStepInput(stepId, e.target.value)}
          placeholder="Ask the assistant about your knowledge files…"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={ask} disabled={!prompt.trim() || isLoading}>
            {isLoading ? "Searching…" : "Ask"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
      {stepState?.output ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <div className="text-sm font-semibold text-neutral-800">Assistant Response</div>
          <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">{stepState.output}</p>
        </div>
      ) : null}
    </div>
  );
}
