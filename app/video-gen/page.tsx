"use client";
import { useCallback } from "react";
import { FeaturePage } from "@/components/feature/FeaturePage";
import { PromptParams } from "@/components/feature/PromptPanel";
import { AnyHistoryItem } from "@/types/history";
import { useAuthStore } from "@/stores/authStore";
import { useHistoryStore } from "@/stores/historyStore";
import { Select } from "@/components/ui/select";
import { TooltipIcon } from "@/components/ui/TooltipIcon";

const VIDEO_MODELS = [
  { value: 'sora-2', label: 'sora-2' },
  { value: 'sora-2-pro', label: 'sora-2-pro' }
];

const VIDEO_SIZES = [
  { value: '1280x720', label: '1280 × 720 (horizontal)' },
  { value: '720x1280', label: '720 × 1280 (vertical)' },
  { value: '1792x1024', label: '1792 × 1024 (widescreen)' },
  { value: '1024x1792', label: '1024 × 1792 (portrait)' }
];

const VIDEO_DURATIONS = [4, 8, 12];

function VideoAdvancedParams({ value, onChange }: { value: PromptParams; onChange: (next: PromptParams) => void }) {
  return (
    <div className="grid md:grid-cols-3 gap-3">
      <div className="md:col-span-1">
        <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
          Model <TooltipIcon text="Choose between sora-2 and sora-2-pro." />
        </div>
        <Select value={value.model || 'sora-2'} onChange={(e) => onChange({ ...value, model: e.target.value })}>
          {VIDEO_MODELS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-1">
        <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
          Duration (seconds) <TooltipIcon text="Longer clips take longer to generate." />
        </div>
        <Select value={(value.seconds ?? 8).toString()} onChange={(e) => onChange({ ...value, seconds: parseInt(e.target.value, 10) })}>
          {VIDEO_DURATIONS.map((sec) => (
            <option key={sec} value={sec}>{sec}</option>
          ))}
        </Select>
      </div>
      <div className="md:col-span-1">
        <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
          Resolution <TooltipIcon text="Select the output aspect ratio." />
        </div>
        <Select value={value.size || '1280x720'} onChange={(e) => onChange({ ...value, size: e.target.value })}>
          {VIDEO_SIZES.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export default function Page() {
  const token = useAuthStore((s) => s.byokToken);

  const pollJob = useCallback((jobId: string, tempId: string, prompt: string, params: PromptParams) => {
    const namespace = 'video-gen' as const;
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    const updateHistory = (mutator: (current: AnyHistoryItem) => AnyHistoryItem) => {
      const state = useHistoryStore.getState();
      const current = state.itemsByNs[namespace]?.find((i) => i.id === tempId);
      if (!current) return;
      const next = mutator(current);
      state.replace(namespace, tempId, next);
    };

    const run = async () => {
      const maxAttempts = 120;
      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        await wait(2500);
        try {
          const res = await fetch(`/api/video/jobs/${jobId}`, {
            headers: { 'X-OPENAI-KEY': token || '' }
          });
          if (!res.ok) {
            const message = await res.text();
            updateHistory((current) => ({
              ...current,
              status: 'failed',
              meta: { ...(current.meta || {}), prompt, params, errorMessage: message || 'Video job failed.' }
            }));
            return;
          }
          const payload = await res.json();
          const rawProgress = typeof payload.progress === 'number' ? payload.progress : 0;
          const normalizedProgress = rawProgress > 1 ? rawProgress / 100 : rawProgress;

          if (payload.status === 'failed') {
            updateHistory((current) => ({
              ...current,
              status: 'failed',
              meta: {
                ...(current.meta || {}),
                prompt,
                params,
                errorMessage: payload.error?.message || 'Video generation failed.',
                progress: normalizedProgress
              }
            }));
            return;
          }

          if (payload.status === 'completed') {
            let previewUrl = payload.posterUrl || '';
            let videoUrl = payload.videoUrl || '';
            try {
              if (payload.posterUrl) {
                const posterRes = await fetch(payload.posterUrl, { headers: { 'X-OPENAI-KEY': token || '' } });
                if (posterRes.ok) {
                  const posterBlob = await posterRes.blob();
                  previewUrl = URL.createObjectURL(posterBlob);
                }
              }
              if (payload.videoUrl) {
                const videoRes = await fetch(payload.videoUrl, { headers: { 'X-OPENAI-KEY': token || '' } });
                if (videoRes.ok) {
                  const videoBlob = await videoRes.blob();
                  videoUrl = URL.createObjectURL(videoBlob);
                }
              }
            } catch (assetErr) {
              console.warn('Unable to download generated video assets', assetErr);
            }
            updateHistory((current) => {
              const currentVideo = current as AnyHistoryItem & { previewUrl?: string; videoUrl?: string };
              return {
                ...currentVideo,
                status: 'ready',
                model: payload.model || currentVideo.model,
                previewUrl: previewUrl || currentVideo.previewUrl,
                videoUrl: videoUrl || currentVideo.videoUrl,
                meta: {
                  ...(currentVideo.meta || {}),
                  prompt,
                  params,
                  progress: 1,
                  seconds: payload.seconds,
                  size: payload.size,
                  jobId
                }
              };
            });
            return;
          }

          updateHistory((current) => {
            const currentVideo = current as AnyHistoryItem & { meta?: Record<string, unknown> };
            return {
              ...currentVideo,
              meta: {
                ...(currentVideo.meta || {}),
                prompt,
                params,
                progress: normalizedProgress,
                seconds: payload.seconds,
                size: payload.size,
                jobId
              }
            };
          });
        } catch (error) {
          console.error('Polling video job failed', error);
        }
      }
      updateHistory((current) => {
        const currentVideo = current as AnyHistoryItem & { meta?: Record<string, unknown> };
        return {
          ...currentVideo,
          status: 'failed',
          meta: {
            ...(currentVideo.meta || {}),
            prompt,
            params,
            errorMessage: 'Timed out waiting for the video to finish.',
            jobId
          }
        };
      });
    };

    void run();
  }, [token]);

  return (
    <FeaturePage
      namespace="video-gen"
      title="Video Generation"
      subtitle="Generate short clips powered by OpenAI Sora." 
      generateLabel="Generate Video"
      initialParams={{ model: 'sora-2', size: '1280x720', seconds: 8 }}
      renderAdvancedParams={(value, onChange) => <VideoAdvancedParams value={value} onChange={onChange} />}
      onGenerate={async (prompt, params, tempId) => {
        if (!token) {
          throw new Error('Add your OpenAI API key in Settings to generate videos.');
        }
        const requestBody = {
          prompt,
          model: params.model || 'sora-2',
          size: params.size || '1280x720',
          seconds: params.seconds ?? 8
        };
        const res = await fetch('/api/video/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OPENAI-KEY': token
          },
          body: JSON.stringify(requestBody)
        });
        if (!res.ok) {
          let message = 'Failed to start video generation';
          try {
            const errorJson = await res.json();
            message = errorJson.message || errorJson.error || message;
          } catch (error) {
            console.warn('Failed to parse video error', error);
          }
          throw new Error(message);
        }
        const data = await res.json();
        const job = data.job as { id: string; model: string; created_at?: number; progress?: number; seconds?: number; size?: string };
        const createdAt = job.created_at ? new Date(job.created_at * 1000).toISOString() : new Date().toISOString();

        pollJob(job.id, tempId, prompt, params);

        const historyItem: AnyHistoryItem = {
          id: tempId,
          kind: 'video',
          title: prompt || 'Generated Video',
          model: job.model,
          createdAt,
          status: 'running',
          previewUrl: '',
          meta: {
            prompt,
            params,
            jobId: job.id,
            progress: job.progress ?? 0,
            seconds: job.seconds,
            size: job.size
          }
        } as AnyHistoryItem;
        return historyItem;
      }}
    />
  );
}


