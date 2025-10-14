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
      namespace="video-gen"
      title="Video Generation"
      subtitle="Mocked video generations with poster previews."
      generateLabel="Generate Video"
      showVersions
      onGenerate={async (prompt, params, tempId) => {
        const res = await fetch('/api/video/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token || '' }, body: JSON.stringify({ prompt, size: params.size || '1280x720', versions: params.versions || 1 }) });
        if (!res.ok) {
          const item: AnyHistoryItem = { id: tempId, kind: 'text', title: 'Failed to queue video', createdAt: new Date().toISOString(), status: 'failed' } as any; return item;
        }
        const data = await res.json();
        const ids: string[] = data.jobIds || [];
        // Add additional versions directly
        ids.slice(1).forEach((jobId: string) => {
          add('video-gen' as any, { id: id('vid'), kind: 'video', title: `${prompt} (${jobId})`, model: params.model, createdAt: new Date().toISOString(), status: 'ready', meta: { prompt, jobId }, previewUrl: '/placeholders/video-poster.svg', durationSec: 12 } as any);
        });
        const item: AnyHistoryItem = { id: tempId, kind: 'video', title: prompt || 'Generated Video', model: params.model, createdAt: new Date().toISOString(), status: 'running', meta: { prompt, jobId: ids[0] }, previewUrl: '/placeholders/video-poster.svg', durationSec: 12 } as any;
        return item;
      }}
    />
  );
}


