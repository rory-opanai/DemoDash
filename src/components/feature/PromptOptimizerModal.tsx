"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Preset = 'Marketing' | 'Narrative' | 'Precision' | 'Short' | 'Descriptive';

function transform(text: string, preset: Preset) {
  switch (preset) {
    case 'Marketing':
      return `You are a world-class copywriter. Craft a persuasive, energetic and benefit-led response.\n\n${text}`;
    case 'Narrative':
      return `Rewrite as a vivid, engaging narrative with a beginning, middle and end.\n\n${text}`;
    case 'Precision':
      return `Respond concisely with numbered steps and clear constraints. Avoid ambiguity.\n\n${text}`;
    case 'Short':
      return `Answer in under 80 words. ${text}`;
    case 'Descriptive':
      return `Add sensory details, concrete nouns and strong verbs. ${text}`;
    default:
      return text;
  }
}

export function PromptOptimizerModal({ open, onOpenChange, prompt, onReplace }: { open: boolean; onOpenChange: (v: boolean) => void; prompt: string; onReplace: (p: string) => void; }) {
  const [before, setBefore] = useState(prompt);
  const [after, setAfter] = useState(prompt);
  const apply = (p: Preset) => setAfter(transform(before, p));
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title="Prompt Optimiser" description="Local string transforms to improve prompts." />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted-foreground">Before</label>
            <Textarea value={before} onChange={(e) => setBefore(e.target.value)} rows={10} />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground">After</label>
            <Textarea value={after} onChange={(e) => setAfter(e.target.value)} rows={10} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {(['Marketing','Narrative','Precision','Short','Descriptive'] as Preset[]).map((p) => (
            <Button key={p} variant="secondary" onClick={() => apply(p)}>{p}</Button>
          ))}
          <div className="ml-auto" />
          <Button onClick={() => onReplace(after)}>Replace prompt</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


