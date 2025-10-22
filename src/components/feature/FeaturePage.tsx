"use client";
import { ReactNode, useCallback, useMemo, useState } from "react";
import { HistoryPanel } from "@/components/feature/HistoryPanel";
import { PromptPanel, PromptParams, defaultPromptParams } from "@/components/feature/PromptPanel";
import { AnyHistoryItem } from "@/types/history";
import { useHistoryStore, type HistoryNamespace } from "@/stores/historyStore";
import { id as makeId } from "@/lib/utils";

export interface PromptExtrasRenderProps {
  prompt: string;
  params: PromptParams;
  setPrompt: (value: string) => void;
  setParams: (next: PromptParams) => void;
  isGenerating: boolean;
}

export interface FeaturePageProps {
  namespace: HistoryNamespace;
  title: string;
  subtitle?: string;
  generateLabel?: string;
  onGenerate: (prompt: string, params: PromptParams, tempId: string) => Promise<AnyHistoryItem | void>;
  rightTopExtras?: ReactNode; // e.g. mic button, filters
  showVersions?: boolean;
  initialPrompt?: string;
  initialParams?: PromptParams;
  renderAdvancedParams?: (value: PromptParams, onChange: (next: PromptParams) => void) => ReactNode;
  renderPromptExtras?: (props: PromptExtrasRenderProps) => ReactNode;
}

export function FeaturePage({
  namespace,
  title,
  subtitle,
  onGenerate,
  generateLabel = 'Run',
  rightTopExtras,
  showVersions,
  initialPrompt,
  initialParams,
  renderAdvancedParams,
  renderPromptExtras
}: FeaturePageProps) {
  const add = useHistoryStore((s) => s.add);
  const replace = useHistoryStore((s) => s.replace);
  const [prompt, setPrompt] = useState<string>(initialPrompt ?? "");
  const [params, setParams] = useState<PromptParams>(() => ({ ...defaultPromptParams, ...(initialParams ?? {}) }));
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRemix = useCallback((item: AnyHistoryItem) => {
    const meta = item.meta || {};
    const nextPrompt = (meta['prompt'] as string) || item.title || "";
    setPrompt(nextPrompt);
    const storedParams = (meta['params'] as PromptParams | undefined) || undefined;
    setParams((prev) => {
      const base: PromptParams = { ...defaultPromptParams, ...(storedParams ?? prev) };
      if (typeof base.seed === 'number') {
        return { ...base, seed: Math.floor(Math.random() * 1_000_000) };
      }
      if (typeof base.temperature === 'number') {
        const variation = base.temperature + (Math.random() * 0.2 - 0.1);
        return { ...base, temperature: Math.min(2, Math.max(0, Number(variation.toFixed(2)))) };
      }
      return base;
    });
  }, []);

  const mergedRenderAdvanced = useMemo(() => renderAdvancedParams, [renderAdvancedParams]);

  async function handleGenerate(p: string, params: PromptParams) {
    if (!p.trim()) return;
    setIsGenerating(true);
    const tempId = makeId('run');
    const running: AnyHistoryItem = {
      id: tempId,
      kind: 'text',
      title: p || 'Running...'
      , createdAt: new Date().toISOString(),
      status: 'running',
      meta: { prompt: p, params }
    } as any;
    add(namespace, running);
    try {
      const ready = await onGenerate(p, params, tempId);
      if (ready) {
        const mergedMeta = { prompt: p, params, ...(ready.meta || {}) };
        replace(namespace, tempId, { ...ready, id: tempId, status: ready.status ?? 'ready', meta: mergedMeta } as AnyHistoryItem);
      }
    } catch (err: unknown) {
      console.error('Generation failed', err);
      const message = err instanceof Error ? err.message : 'Unknown error';
      replace(namespace, tempId, {
        id: tempId,
        kind: 'text',
        title: 'Generation failed',
        createdAt: new Date().toISOString(),
        status: 'failed',
        meta: { prompt: p, params, errorMessage: message }
      } as AnyHistoryItem);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-6">
      <HistoryPanel namespace={namespace} onRemix={handleRemix} />
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
            {subtitle ? <p className="text-sm text-neutral-600">{subtitle}</p> : null}
          </div>
          {rightTopExtras}
        </div>
        <PromptPanel
          prompt={prompt}
          setPrompt={setPrompt}
          params={params}
          onParamsChange={setParams}
          onGenerate={handleGenerate}
          generateLabel={generateLabel}
          showVersions={showVersions}
          isGenerating={isGenerating}
          renderAdvanced={mergedRenderAdvanced}
          extras={
            renderPromptExtras
              ? renderPromptExtras({ prompt, params, setPrompt, setParams, isGenerating })
              : undefined
          }
        />
      </div>
    </div>
  );
}


