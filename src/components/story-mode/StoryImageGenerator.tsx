"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { storyStepSelectors, useStoryModeStore } from "@/stores/storyModeStore";

export function StoryImageGenerator({
  stepId,
  initialPrompt
}: {
  stepId: string;
  initialPrompt: string;
}) {
  const token = useAuthStore((s) => s.byokToken);
  const stepState = useStoryModeStore(storyStepSelectors.step(stepId));
  const setStepInput = useStoryModeStore((s) => s.setStepInput);
  const completeStep = useStoryModeStore((s) => s.completeStep);
  const prompt = stepState?.input ?? initialPrompt;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stepState) {
      setStepInput(stepId, initialPrompt);
    }
  }, [initialPrompt, setStepInput, stepId, stepState]);

  async function generate() {
    if (!prompt.trim() || isLoading) return;
    if (!token) {
      setError("Add your OpenAI API key in Settings before generating.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OPENAI-KEY": token
        },
        body: JSON.stringify({
          prompt,
          size: "1024x1024",
          model: "gpt-image-1",
          versions: 1,
          quality: "high",
          outputFormat: "png"
        })
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || "Failed to generate image.");
      }
      const data = await res.json();
      const first = data.items?.[0];
      if (!first?.previewUrl) {
        throw new Error("Image response missing previewUrl.");
      }
      completeStep(stepId, {
        output: first.previewUrl,
        data: {
          imageUrl: first.previewUrl,
          model: first.model,
          prompt
        }
      });
    } catch (err) {
      console.error("Story image generation failed", err);
      const message = err instanceof Error ? err.message : "Failed to generate image.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="text-sm font-medium text-neutral-800">Prompt</div>
        <Textarea
          value={prompt}
          onChange={(e) => setStepInput(stepId, e.target.value)}
          rows={4}
          placeholder="Describe the logo you want to generate…"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={generate} disabled={!prompt.trim() || isLoading}>
            {isLoading ? "Generating…" : "Generate Logo"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
      {stepState?.data?.imageUrl ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <div className="text-sm font-medium text-neutral-800 mb-2">Generated Logo Preview</div>
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-white">
            <Image
              src={String(stepState.data.imageUrl)}
              alt="Generated logo"
              fill
              className="object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
