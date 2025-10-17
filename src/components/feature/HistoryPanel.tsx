"use client";
import { useHistoryStore, type HistoryNamespace } from "@/stores/historyStore";
import { AnyHistoryItem } from "@/types/history";
import { HistoryCard } from "@/components/feature/HistoryCard";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function HistoryPanel({ namespace, onRemix }: { namespace: HistoryNamespace; onRemix: (item: AnyHistoryItem) => void }) {
  const items = useHistoryStore((s) => s.itemsByNs[namespace] ?? []);
  const remove = useHistoryStore((s) => s.remove);
  const clear = useHistoryStore((s) => s.clear);
  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 h-[calc(100vh-12rem)] lg:sticky lg:top-24 overflow-auto">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-[15px] font-semibold text-neutral-900">History</h2>
        {items.length ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[12px] text-neutral-600 hover:text-red-600 hover:bg-red-600/10"
            onClick={() => clear(namespace)}
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />Clear
          </Button>
        ) : null}
      </div>
      <div className="space-y-4">
        {items.length === 0 ? <p className="text-sm text-neutral-500">No runs yet. Your generations will appear here.</p> : null}
        {items.map((item: AnyHistoryItem) => (
          <HistoryCard key={item.id} item={item} onRemix={() => onRemix(item)} onDelete={() => remove(namespace, item.id)} />
        ))}
      </div>
    </aside>
  );
}


