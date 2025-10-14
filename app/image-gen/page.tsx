"use client";
import { FeaturePage } from "@/components/feature/FeaturePage";
import { AnyHistoryItem } from "@/types/history";
import { id } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useHistoryStore } from "@/stores/historyStore";

export default function Page() {
  const token = useAuthStore((s) => s.byokToken);
  const add = useHistoryStore((s) => s.add);
  return (
    <FeaturePage
      namespace="image-gen"
      title="Image Generation"
      subtitle="Generate placeholder images from prompts."
      generateLabel="Generate Image"
      showVersions
      onGenerate={async (prompt, params, tempId) => {
        const res = await fetch('/api/images/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token || '' }, body: JSON.stringify({ prompt, size: params.size || '1024x1024', seed: params.seed, versions: params.versions || 1 }) });
        if (!res.ok) {
          const item: AnyHistoryItem = { id: tempId, kind: 'text', title: 'Failed to generate', createdAt: new Date().toISOString(), status: 'failed' } as any; return item;
        }
        const data = await res.json();
        // Add additional versions as separate history items
        data.items.slice(1).forEach((it: any) => {
          add('image-gen' as any, { id: id('img'), kind: 'image', title: prompt || 'Generated Image', model: it.model, createdAt: it.createdAt, status: 'ready', meta: { prompt }, previewUrl: it.url } as any);
        });
        const first = data.items[0];
        const item: AnyHistoryItem = { id: tempId, kind: 'image', title: prompt || 'Generated Image', model: first.model, createdAt: first.createdAt, status: 'running', meta: { prompt }, previewUrl: first.url } as any;
        return item;
      }}
    />
  );
}


