"use client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TooltipIcon } from "@/components/ui/TooltipIcon";
import { useAuthStore } from "@/stores/authStore";

export interface AdvancedParamsValue {
  temperature: number;
  maxTokens: number;
  seed?: number;
  size?: string;
  version?: string;
  model?: string;
  versions?: 1 | 2 | 3 | 4;
}

export function AdvancedParams({ value, onChange, showVersions }: { value: AdvancedParamsValue; onChange: (v: AdvancedParamsValue) => void; showVersions?: boolean }) {
  const model = useAuthStore((s) => s.model);
  return (
    <Accordion type="single" collapsible defaultValue="adv">
      <AccordionItem value="adv">
        <AccordionTrigger>
          <div className="inline-flex items-center gap-2 text-[14px]">Advanced parameters <TooltipIcon text="These run locally in Phase 1." /></div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-neutral-800">Model</label>
              <Select value={value.model || model} onChange={(e) => onChange({ ...value, model: e.target.value })}>
                <option value="gpt-5">gpt-5</option>
                <option value="gpt-5-mini">gpt-5-mini</option>
                <option value="sora-2">sora-2</option>
                <option value="gpt-5-realtime">gpt-5-realtime</option>
              </Select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-neutral-800">Temperature</label>
              <Input type="number" min={0} max={2} step={0.1} value={value.temperature} onChange={(e) => onChange({ ...value, temperature: parseFloat(e.target.value) })} />
            </div>
            <div>
              <label className="text-[13px] font-medium text-neutral-800">Size</label>
              <Select value={value.size || '1024x1024'} onChange={(e) => onChange({ ...value, size: e.target.value })}>
                <option value="1024x1024">1024x1024</option>
                <option value="1280x720">1280x720</option>
                <option value="1920x1080">1920x1080</option>
              </Select>
            </div>
            <div>
              <label className="text-[13px] font-medium text-neutral-800">Max output length</label>
              <Input type="number" min={64} max={8192} value={value.maxTokens} onChange={(e) => onChange({ ...value, maxTokens: parseInt(e.target.value, 10) })} />
            </div>
            <div>
              <label className="text-[13px] font-medium text-neutral-800">Seed</label>
              <Input type="number" value={value.seed ?? 0} onChange={(e) => onChange({ ...value, seed: parseInt(e.target.value, 10) })} />
            </div>
            {showVersions ? (
              <div>
                <label className="text-[13px] font-medium text-neutral-800">Versions</label>
                <Select value={(value.versions || 1).toString()} onChange={(e) => onChange({ ...value, versions: parseInt(e.target.value, 10) as any })}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </Select>
              </div>
            ) : null}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}


