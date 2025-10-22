"use client";
import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState
} from "react";
import { FeaturePage } from "@/components/feature/FeaturePage";
import { PromptParams } from "@/components/feature/PromptPanel";
import { AnyHistoryItem } from "@/types/history";
import { cn, id } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useHistoryStore } from "@/stores/historyStore";
import { Select } from "@/components/ui/select";
import { TooltipIcon } from "@/components/ui/TooltipIcon";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const IMAGE_SIZES = [
  { value: "1024x1024", label: "1024 × 1024 (square)" },
  { value: "1536x1024", label: "1536 × 1024 (landscape)" },
  { value: "1024x1536", label: "1024 × 1536 (portrait)" }
];

const IMAGE_QUALITIES = [
  { value: "auto", label: "auto" },
  { value: "high", label: "high" },
  { value: "medium", label: "medium" },
  { value: "low", label: "low" }
];

const OUTPUT_FORMATS = [
  { value: "png", label: "png" },
  { value: "jpeg", label: "jpeg" },
  { value: "webp", label: "webp" }
];

const ACCEPTED_REFERENCE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_REFERENCE_IMAGES = 3;
const MAX_REFERENCE_FILE_SIZE = 20 * 1024 * 1024; // 20MB

type ReferenceItem = {
  id: string;
  file: File;
  previewUrl: string;
};

function ReferenceImagesSection({
  references,
  onAdd,
  onRemove,
  isGenerating,
  error
}: {
  references: ReferenceItem[];
  onAdd: (files: FileList | File[]) => void;
  onRemove: (id: string) => void;
  isGenerating: boolean;
  error: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const disabled = isGenerating;

  const handleBrowse = useCallback(() => {
    if (disabled) return;
    fileInputRef.current?.click();
  }, [disabled]);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;
      const files = event.dataTransfer?.files;
      if (files?.length) {
        onAdd(files);
      }
    },
    [disabled, onAdd]
  );

  const handleDragOver = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled) return;
      setIsDragOver(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files?.length) {
        onAdd(files);
      }
      event.target.value = "";
    },
    [onAdd]
  );

  return (
    <section>
      <div className="text-sm font-medium text-neutral-800">Reference images</div>
      <p className="mt-1 text-xs text-neutral-500">
        Optional. Start with a model photo of the person, then add up to two garment references.
      </p>
      <div
        className={cn(
          "mt-3 rounded-xl border-2 border-dashed bg-neutral-50 p-4 text-sm text-neutral-600 transition-colors",
          disabled ? "opacity-60 pointer-events-none" : "hover:border-neutral-400",
          isDragOver ? "border-blue-500 bg-blue-50" : "border-neutral-300"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="presentation"
      >
        <p className="text-xs text-neutral-600">Drag and drop reference images here, or</p>
        <div className="mt-3 inline-flex items-center gap-3">
          <Button type="button" variant="secondary" size="sm" onClick={handleBrowse} disabled={disabled}>
            Browse files
          </Button>
          <span className="text-[11px] text-neutral-500">JPG, PNG, or WebP · Max {MAX_REFERENCE_IMAGES} images</span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled}
        />
      </div>
      {error ? <p className="mt-2 text-xs text-red-600">{error}</p> : null}
      {references.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {references.map((item, index) => (
            <div key={item.id} className="relative overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.previewUrl} alt={item.file.name || "Reference image"} className="h-28 w-full object-cover" />
              <div className="absolute top-2 right-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(item.id)}
                  disabled={disabled}
                  aria-label="Remove reference"
                  className="bg-white/80 hover:bg-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="px-3 py-2">
                <div className="text-xs font-medium text-neutral-800">
                  {index === 0 ? "Model photo" : `Garment reference ${index}`}
                </div>
                <div className="text-[11px] text-neutral-500 truncate" title={item.file.name}>
                  {item.file.name || "Unnamed file"}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-neutral-500">No references added yet.</p>
      )}
    </section>
  );
}

function ImageAdvancedParams({ value, onChange }: { value: PromptParams; onChange: (next: PromptParams) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Model <TooltipIcon text="All generations run on gpt-image-1." />
          </div>
          <div className="mt-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            gpt-image-1 (fixed)
          </div>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Size <TooltipIcon text="Controls the output resolution." />
          </div>
          <Select value={value.size || "1024x1024"} onChange={(e) => onChange({ ...value, size: e.target.value })}>
            {IMAGE_SIZES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Quality <TooltipIcon text="Higher quality consumes more compute." />
          </div>
          <Select value={value.quality || "auto"} onChange={(e) => onChange({ ...value, quality: e.target.value })}>
            {IMAGE_QUALITIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Output format <TooltipIcon text="Choose the encoded download format." />
          </div>
          <Select value={value.outputFormat || "png"} onChange={(e) => onChange({ ...value, outputFormat: e.target.value })}>
            {OUTPUT_FORMATS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <div className="flex items-center gap-1 text-[13px] font-medium text-neutral-800">
            Versions <TooltipIcon text="Generate up to four variations for the prompt." />
          </div>
          <Select value={(value.versions ?? 1).toString()} onChange={(e) => onChange({ ...value, versions: parseInt(e.target.value, 10) })}>
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
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
  const [references, setReferences] = useState<ReferenceItem[]>([]);
  const [referenceError, setReferenceError] = useState<string | null>(null);
  const referencesRef = useRef<ReferenceItem[]>([]);

  useEffect(() => {
    referencesRef.current = references;
  }, [references]);

  useEffect(() => {
    return () => {
      referencesRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const handleAddReferences = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList ?? []);
    if (!incoming.length) return;
    let error: string | null = null;
    setReferences((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= MAX_REFERENCE_IMAGES) {
          if (!error) error = `You can upload up to ${MAX_REFERENCE_IMAGES} reference images.`;
          break;
        }
        if (!ACCEPTED_REFERENCE_TYPES.has(file.type)) {
          if (!error) error = `Unsupported file type for ${file.name || "file"}. Upload JPG, PNG, or WebP images.`;
          continue;
        }
        if (file.size > MAX_REFERENCE_FILE_SIZE) {
          if (!error) error = `${file.name || "File"} is too large. Files must be 20MB or smaller.`;
          continue;
        }
        next.push({ id: id("ref"), file, previewUrl: URL.createObjectURL(file) });
      }
      return next;
    });
    setReferenceError(error);
  }, []);

  const handleRemoveReference = useCallback((removeId: string) => {
    setReferences((prev) => {
      const next: ReferenceItem[] = [];
      for (const item of prev) {
        if (item.id === removeId) {
          URL.revokeObjectURL(item.previewUrl);
        } else {
          next.push(item);
        }
      }
      return next;
    });
    setReferenceError(null);
  }, []);

  return (
    <FeaturePage
      namespace="image-gen"
      title="Image Generation"
      subtitle="Create production-ready visuals backed by OpenAI image models."
      generateLabel="Generate Image"
      showVersions
      initialParams={{ model: "gpt-image-1", size: "1024x1024", versions: 1, quality: "auto", outputFormat: "png" }}
      renderAdvancedParams={(value, onChange) => <ImageAdvancedParams value={value} onChange={onChange} />}
      renderPromptExtras={({ isGenerating }) => (
        <ReferenceImagesSection
          references={references}
          onAdd={handleAddReferences}
          onRemove={handleRemoveReference}
          isGenerating={isGenerating}
          error={referenceError}
        />
      )}
      onGenerate={async (prompt, params, tempId) => {
        const paramsForHistory: PromptParams = { ...params, model: "gpt-image-1" };
        const filenamesForRun = references.map((item) => item.file.name);
        const formData = new FormData();
        formData.append("prompt", prompt);
        formData.append("size", params.size || "1024x1024");
        formData.append("versions", String(params.versions ?? 1));
        formData.append("quality", params.quality || "auto");
        formData.append("outputFormat", params.outputFormat || "png");
        references.forEach((item) => {
          formData.append("references", item.file, item.file.name);
        });
        const res = await fetch("/api/images/generate", {
          method: "POST",
          headers: {
            "X-OPENAI-KEY": token || ""
          },
          body: formData
        });
        if (!res.ok) {
          let message = "Failed to generate image";
          try {
            const errorJson = await res.json();
            message = errorJson.message || errorJson.error || message;
          } catch (err) {
            console.warn("Failed to parse image error", err);
          }
          throw new Error(message);
        }
        const data = await res.json();
        if (!data.items?.length) {
          throw new Error("No image returned from API");
        }
        const [first, ...rest] = data.items as Array<{ id: string; previewUrl: string; createdAt: string; model: string }>;
        if (!first) {
          throw new Error("Image response missing primary result");
        }
        rest.forEach((item) => {
          const historyItem: AnyHistoryItem = {
            id: id("img"),
            kind: "image",
            title: prompt || "Generated Image",
            model: item.model,
            createdAt: item.createdAt,
            status: "ready",
            previewUrl: item.previewUrl,
            meta: { prompt, params: paramsForHistory, referenceFilenames: filenamesForRun }
          } as AnyHistoryItem;
          add("image-gen", historyItem);
        });
        const main: AnyHistoryItem = {
          id: tempId,
          kind: "image",
          title: prompt || "Generated Image",
          model: first.model,
          createdAt: first.createdAt,
          status: "ready",
          previewUrl: first.previewUrl,
          meta: { prompt, params: paramsForHistory, referenceFilenames: filenamesForRun }
        } as AnyHistoryItem;
        return main;
      }}
    />
  );
}
