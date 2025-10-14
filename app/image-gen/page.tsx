"use client";
import { FeaturePage } from "@/components/feature/FeaturePage";
import { PromptParams } from "@/components/feature/PromptPanel";
import { AnyHistoryItem } from "@/types/history";
import { id } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useHistoryStore } from "@/stores/historyStore";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TooltipIcon } from "@/components/ui/TooltipIcon";

const IMAGE_MODELS = [
  { value: 'gpt-image-1', label: 'gpt-image-1 (latest)' },
  { value: 'dall-e-3', label: 'dall-e-3' }
];

const IMAGE_SIZES = [
  { value: '1024x1024', label: '1024 × 1024 (square)' },
  { value: '1536x1024', label: '1536 × 1024 (landscape)' },
  { value: '1024x1536', label: '1024 × 1536 (portrait)' },
  { value: '1792x1024', label: '1792 × 1024 (cinematic)' },
  { value: '1024x1792', label: '1024 × 1792 (tall)' }
];

const IMAGE_QUALITIES = [
  { value: 'auto', label: 'auto' },
  { value: 'high', label: 'high' },
  { value: 'medium', label: 'medium' },
  { value: 'low', label: 'low' },
  { value: 'hd', label: 'hd (dall-e-3 only)' }
];

const OUTPUT_FORMATS = [
  { value: 'png', label: 'png' },
  { value: 'jpeg', label: 'jpeg' },
  { value: 'webp', label: 'webp' }
];

function ImageAdvancedParams({ value, onChange }: { value: PromptParams; onChange: (next: PromptParams) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Model <TooltipIcon text="Choose between gpt-image-1 and dall-e-3." />
          </div>
          <Select value={value.model || 'gpt-image-1'} onChange={(e) => onChange({ ...value, model: e.target.value })}>
            {IMAGE_MODELS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Size <TooltipIcon text="Controls the output resolution." />
          </div>
          <Select value={value.size || '1024x1024'} onChange={(e) => onChange({ ...value, size: e.target.value })}>
            {IMAGE_SIZES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Quality <TooltipIcon text="Higher quality consumes more compute." />
          </div>
          <Select value={value.quality || 'auto'} onChange={(e) => onChange({ ...value, quality: e.target.value })}>
            {IMAGE_QUALITIES.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Output format <TooltipIcon text="Choose the encoded download format." />
          </div>
          <Select value={value.outputFormat || 'png'} onChange={(e) => onChange({ ...value, outputFormat: e.target.value })}>
            {OUTPUT_FORMATS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Versions <TooltipIcon text="Generate up to four variations for the prompt." />
          </div>
          <Select value={(value.versions ?? 1).toString()} onChange={(e) => onChange({ ...value, versions: parseInt(e.target.value, 10) })}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const token = useAuthStore((s) => s.byokToken);
  const add = useHistoryStore((s) => s.add);
  return (
    <FeaturePage
      namespace="image-gen"
      title="Image Generation"
      subtitle="Create production-ready visuals backed by OpenAI image models."
      generateLabel="Generate Image"
      showVersions
      initialParams={{ model: 'gpt-image-1', size: '1024x1024', versions: 1, quality: 'auto', outputFormat: 'png' }}
      renderAdvancedParams={(value, onChange) => <ImageAdvancedParams value={value} onChange={onChange} />}
      onGenerate={async (prompt, params, tempId) => {
        const requestBody = {
          prompt,
          size: params.size || '1024x1024',
          model: params.model || 'gpt-image-1',
          versions: params.versions ?? 1,
          quality: params.quality || 'auto',
          outputFormat: params.outputFormat || 'png',
          seed: params.seed
        };
        const res = await fetch('/api/images/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-OPENAI-KEY': token || ''
          },
          body: JSON.stringify(requestBody)
        });
        if (!res.ok) {
          let message = 'Failed to generate image';
          try {
            const errorJson = await res.json();
            message = errorJson.message || errorJson.error || message;
          } catch (err) {
            console.warn('Failed to parse image error', err);
          }
          throw new Error(message);
        }
        const data = await res.json();
        if (!data.items?.length) {
          throw new Error('No image returned from API');
        }
        const [first, ...rest] = data.items as Array<{ id: string; previewUrl: string; createdAt: string; model: string }>;
        if (!first) {
          throw new Error('Image response missing primary result');
        }
        rest.forEach((item) => {
          const historyItem: AnyHistoryItem = {
            id: id('img'),
            kind: 'image',
            title: prompt || 'Generated Image',
            model: item.model,
            createdAt: item.createdAt,
            status: 'ready',
            previewUrl: item.previewUrl,
            meta: { prompt, params }
          } as AnyHistoryItem;
          add('image-gen', historyItem);
        });
        const main: AnyHistoryItem = {
          id: tempId,
          kind: 'image',
          title: prompt || 'Generated Image',
          model: first.model,
          createdAt: first.createdAt,
          status: 'ready',
          previewUrl: first.previewUrl,
          meta: { prompt, params }
        } as AnyHistoryItem;
        return main;
      }}
    />
  );
}


