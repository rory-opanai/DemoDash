"use client";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AdvancedParams, AdvancedParamsValue } from "@/components/feature/AdvancedParams";
import { PromptOptimizerModal } from "@/components/feature/PromptOptimizerModal";
import { CurlDrawer } from "@/components/ui/CurlDrawer";
import { useAuthStore } from "@/stores/authStore";

export interface PromptParams extends AdvancedParamsValue {}

export function PromptPanel({ prompt, setPrompt, onGenerate, generateLabel = 'Run', showVersions }: { prompt: string; setPrompt: (v: string) => void; onGenerate: (p: string, params: PromptParams) => void | Promise<void>; generateLabel?: string; showVersions?: boolean; }) {
  const [open, setOpen] = useState(false);
  const [params, setParams] = useState<AdvancedParamsValue>({ temperature: 0.7, maxTokens: 1024, seed: 0 });
  const model = useAuthStore((s) => s.model);

  const charCount = prompt.length;

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 md:p-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-neutral-600">Enter your prompt</div>
        <div className="text-xs text-neutral-500">{charCount} chars</div>
      </div>
      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={8} placeholder="Describe what you want to generate..." />
      <div className="mt-3 flex items-center justify-between">
        <Button variant="secondary" onClick={() => setOpen(true)}>Prompt Optimiser</Button>
        <Button onClick={() => onGenerate(prompt, params)}>{generateLabel}</Button>
      </div>
      <div className="mt-4">
        <AdvancedParams value={params} onChange={setParams} showVersions={showVersions} />
      </div>

      <PromptOptimizerModal open={open} onOpenChange={setOpen} prompt={prompt} onReplace={setPrompt} />
      <CurlDrawer curl={`curl https://api.openai.com/v1/chat/completions \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"model":"${params.model || model}","input":"${prompt.replace(/"/g, '\\"')}"}'`} />
    </div>
  );
}


