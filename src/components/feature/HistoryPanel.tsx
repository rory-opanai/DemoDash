"use client";
import { useHistoryStore, type HistoryNamespace } from "@/stores/historyStore";
import { AnyHistoryItem } from "@/types/history";
import { HistoryCard } from "@/components/feature/HistoryCard";

export function HistoryPanel({ namespace, onRemix }: { namespace: HistoryNamespace; onRemix: (item: AnyHistoryItem) => void }) {
  const items = useHistoryStore((s) => s.itemsByNs[namespace] ?? []);
  const remove = useHistoryStore((s) => s.remove);
  return (
    <aside className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 h-[calc(100vh-12rem)] lg:sticky lg:top-24 overflow-auto">
      <h2 className="text-[15px] font-semibold text-neutral-900 mb-3">History</h2>
      <div className="space-y-4">
        {items.length === 0 ? <p className="text-sm text-neutral-500">No runs yet. Your generations will appear here.</p> : null}
        {items.map((item: AnyHistoryItem) => (
          <HistoryCard key={item.id} item={item} onRemix={() => onRemix(item)} onDelete={() => remove(namespace, item.id)} />
        ))}
      </div>
    </aside>
  );
}


