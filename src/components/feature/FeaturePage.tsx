"use client";
import { ReactNode, useState } from "react";
import { HistoryPanel } from "@/components/feature/HistoryPanel";
import { PromptPanel, PromptParams } from "@/components/feature/PromptPanel";
import { AnyHistoryItem } from "@/types/history";
import { useHistoryStore, type HistoryNamespace } from "@/stores/historyStore";
import { id as makeId } from "@/lib/utils";

export interface FeaturePageProps {
  namespace: HistoryNamespace;
  title: string;
  subtitle?: string;
  generateLabel?: string;
  onGenerate: (prompt: string, params: PromptParams, tempId: string) => Promise<AnyHistoryItem>;
  rightTopExtras?: ReactNode; // e.g. mic button, filters
  showVersions?: boolean;
}

export function FeaturePage({ namespace, title, subtitle, onGenerate, generateLabel = 'Run', rightTopExtras, showVersions }: FeaturePageProps) {
  const add = useHistoryStore((s) => s.add);
  const replace = useHistoryStore((s) => s.replace);
  const [prompt, setPrompt] = useState<string>("");

  async function handleGenerate(p: string, params: PromptParams) {
    const tempId = makeId('run');
    const running: AnyHistoryItem = {
      id: tempId,
      kind: 'text',
      title: p || 'Running...'
      , createdAt: new Date().toISOString(),
      status: 'running',
      meta: { prompt: p }
    } as any;
    add(namespace, running);
    const ready = await onGenerate(p, params, tempId);
    // Regardless of what the generator returned, mark the temp entry as ready for Phase 1
    replace(namespace, tempId, { ...ready, id: tempId, status: 'ready' } as AnyHistoryItem);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-6">
      <HistoryPanel namespace={namespace} onRemix={(text) => setPrompt(text)} />
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
            {subtitle ? <p className="text-sm text-neutral-600">{subtitle}</p> : null}
          </div>
          {rightTopExtras}
        </div>
        <PromptPanel prompt={prompt} setPrompt={setPrompt} onGenerate={handleGenerate} generateLabel={generateLabel} showVersions={showVersions} />
      </div>
    </div>
  );
}


