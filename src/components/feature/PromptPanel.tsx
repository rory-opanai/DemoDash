"use client";
import { ReactNode, useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AdvancedParams, AdvancedParamsValue } from "@/components/feature/AdvancedParams";
import { PromptOptimizerModal } from "@/components/feature/PromptOptimizerModal";
import { CurlDrawer } from "@/components/ui/CurlDrawer";
import { useAuthStore } from "@/stores/authStore";

export interface PromptParams extends AdvancedParamsValue {}

export const defaultPromptParams: PromptParams = {
  temperature: 0.7,
  maxTokens: 1024,
  seed: undefined,
  size: "1024x1024",
  model: undefined,
  versions: 1
};

export function PromptPanel({
  prompt,
  setPrompt,
  params,
  onParamsChange,
  onGenerate,
  generateLabel = "Run",
  showVersions,
  isGenerating,
  renderAdvanced
}: {
  prompt: string;
  setPrompt: (v: string) => void;
  params: PromptParams;
  onParamsChange: (params: PromptParams) => void;
  onGenerate: (p: string, params: PromptParams) => void | Promise<void>;
  generateLabel?: string;
  showVersions?: boolean;
  isGenerating?: boolean;
  renderAdvanced?: (value: PromptParams, onChange: (next: PromptParams) => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
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
        <Button onClick={() => onGenerate(prompt, params)} disabled={isGenerating || !prompt.trim()}>
          {isGenerating ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              {generateLabel}
            </span>
          ) : (
            generateLabel
          )}
        </Button>
      </div>
      <div className="mt-4">
        {renderAdvanced
          ? renderAdvanced(params, onParamsChange)
          : <AdvancedParams value={params} onChange={onParamsChange} showVersions={showVersions} />}
      </div>

      <PromptOptimizerModal open={open} onOpenChange={setOpen} prompt={prompt} onReplace={setPrompt} />
      <CurlDrawer curl={`curl https://api.openai.com/v1/chat/completions \
  -H 'Authorization: Bearer <TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"model":"${params.model || model}","input":"${prompt.replace(/"/g, '\"')}"}'`} />
    </div>
  );
}


