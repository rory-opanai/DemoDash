"use client";
import { AnyHistoryItem } from "@/types/history";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { ArrowDownToLine, RefreshCw, Trash2 } from "lucide-react";

export function HistoryCard({ item, onRemix, onDelete }: { item: AnyHistoryItem; onRemix: (prompt: string) => void; onDelete: () => void }) {
  const handleDownload = () => {
    if (item.kind === 'image' || item.kind === 'video') {
      // Download placeholder SVG or poster
      fetch((item as any).previewUrl)
        .then((r) => r.text())
        .then((text) => downloadBlob(text, `${item.title.replace(/\s+/g, '_')}.svg`, 'image/svg+xml'))
        .catch(() => downloadBlob('Preview', `${item.title}.txt`, 'text/plain'));
    } else if (item.kind === 'json') {
      downloadBlob(JSON.stringify((item as any).json, null, 2), `${item.title.replace(/\s+/g, '_')}.json`, 'application/json');
    } else {
      downloadBlob((item as any).meta?.text || item.title, `${item.title}.txt`, 'text/plain');
    }
  };

  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{item.title}</div>
          <div className="text-xs text-neutral-600">{formatDateTime(item.createdAt)} · {item.model || 'model'}</div>
        </div>
        <Badge className="shrink-0">{item.status}</Badge>
      </div>
      <div className="mt-3">
        {item.kind === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(item as any).previewUrl} alt="preview" className="w-full rounded-lg border border-neutral-200" />
        )}
        {item.kind === 'video' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(item as any).previewUrl} alt="video poster" className="w-full rounded-lg border border-neutral-200" />
        )}
        {item.kind === 'json' && (
          <pre className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs overflow-x-auto max-h-48">{JSON.stringify((item as any).json, null, 2)}</pre>
        )}
        {item.kind === 'text' && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
            {(item as any).meta?.answer || 'Text result'}
          </div>
        )}
        {item.kind === 'chart' && (
          <div className="rounded-lg border border-neutral-200 p-3 bg-white">
            {(() => { const ChartComp = (item as any).meta?.chart; return ChartComp ? <ChartComp data={(item as any).meta.data} /> : null; })()}
            <div className="text-xs text-neutral-600 mt-2">{(item as any).meta?.summary}</div>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onRemix((((item as any).meta?.['prompt'] as string) ?? ''))}><RefreshCw className="h-4 w-4 mr-1" />Remix</Button>
        <Button variant="outline" size="sm" onClick={handleDownload}><ArrowDownToLine className="h-4 w-4 mr-1" />Download</Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="ml-auto text-red-600 hover:bg-red-600/10"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
      </div>
    </div>
  );
}


