"use client";
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

export function InspectorDrawer({ open, onOpenChange, results }: { open: boolean; onOpenChange: (v: boolean) => void; results: { id: string; text: string; score: number }[] }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader title="Top-K results" description="Similarity scores and snippets." />
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {results.map((r) => (
            <div key={r.id} className="rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between text-[13px]">
                <div className="font-medium">{r.id}</div>
                <div className="text-neutral-600">{Math.round(r.score*100)}%</div>
              </div>
              <div className="text-[13px] text-neutral-700 mt-1">{r.text}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}


