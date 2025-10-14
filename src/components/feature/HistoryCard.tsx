"use client";
import { useState } from "react";
import { AnyHistoryItem } from "@/types/history";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { downloadBlob } from "@/lib/download";
import { AlertCircle, ArrowDownToLine, Loader2, RefreshCw, Share2, Trash2 } from "lucide-react";

export function HistoryCard({ item, onRemix, onDelete }: { item: AnyHistoryItem; onRemix: () => void; onDelete: () => void }) {
  const [copied, setCopied] = useState(false);

  const handleDownload = async () => {
    try {
      if (item.kind === 'image') {
        const previewUrl = (item as any).previewUrl as string | undefined;
        if (!previewUrl) throw new Error('No image available to download.');
        const res = await fetch(previewUrl);
        const blob = await res.blob();
        const extension = blob.type.includes('png') ? 'png' : blob.type.includes('jpeg') ? 'jpg' : 'webp';
        downloadBlob(blob, `${item.title.replace(/\s+/g, '_')}.${extension}`, blob.type);
        return;
      }
      if (item.kind === 'video') {
        const videoUrl = ((item as any).videoUrl as string | undefined) || (item.meta?.['videoUrl'] as string | undefined);
        if (!videoUrl) throw new Error('Video is not ready yet.');
        const res = await fetch(videoUrl);
        const blob = await res.blob();
        downloadBlob(blob, `${item.title.replace(/\s+/g, '_')}.mp4`, blob.type || 'video/mp4');
        return;
      }
      if (item.kind === 'json') {
        downloadBlob(JSON.stringify((item as any).json, null, 2), `${item.title.replace(/\s+/g, '_')}.json`, 'application/json');
        return;
      }
      const text = ((item as any).meta?.text as string) || (item as any).meta?.answer || item.title;
      downloadBlob(text, `${item.title.replace(/\s+/g, '_')}.txt`, 'text/plain');
    } catch (err) {
      console.error('Download failed', err);
      downloadBlob('Content unavailable', `${item.title.replace(/\s+/g, '_')}.txt`, 'text/plain');
    }
  };

  const handleShare = async () => {
    const link =
      (item.kind === 'video' ? ((item as any).videoUrl as string | undefined) || (item.meta?.['videoUrl'] as string | undefined) : undefined) ||
      ((item as any).previewUrl as string | undefined) ||
      (item.meta?.['shareUrl'] as string | undefined);
    if (!link || typeof navigator === 'undefined' || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Share copy failed', err);
    }
  };

  const isRunning = item.status === 'running';
  const progress = typeof item.meta?.['progress'] === 'number' ? Math.round((item.meta['progress'] as number) * 100) : null;
  const errorMessage = item.meta?.['errorMessage'] as string | undefined;
  const badgeClass = item.status === 'failed'
    ? 'bg-red-100 text-red-700'
    : item.status === 'running'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-neutral-900 text-white';

  return (
    <div className="rounded-xl border border-neutral-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="font-medium truncate">{item.title}</div>
          <div className="text-xs text-neutral-600">{formatDateTime(item.createdAt)} · {item.model || 'model'}</div>
        </div>
        <Badge className={`shrink-0 ${badgeClass}`}>
          {item.status}
        </Badge>
      </div>
      <div className="mt-3">
        {isRunning ? (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-700">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {progress !== null ? `Processing ${progress}%` : 'Processing…'}
          </div>
        ) : null}
        {item.kind === 'image' && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(item as any).previewUrl} alt="preview" className="w-full rounded-lg border border-neutral-200" />
        )}
        {item.kind === 'video' && (
          <video
            controls
            playsInline
            poster={(item as any).previewUrl}
            src={((item as any).videoUrl as string | undefined) || (item.meta?.['videoUrl'] as string | undefined)}
            className="w-full rounded-lg border border-neutral-200"
          />
        )}
        {item.kind === 'json' && (
          <pre className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-xs overflow-x-auto max-h-48">{JSON.stringify((item as any).json, null, 2)}</pre>
        )}
        {item.kind === 'text' && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
            {(item as any).meta?.answer || (item as any).meta?.text || 'Text result'}
          </div>
        )}
        {item.kind === 'chart' && (
          <div className="rounded-lg border border-neutral-200 p-3 bg-white">
            {(() => {
              const ChartComp = (item as any).meta?.chart;
              return ChartComp ? <ChartComp data={(item as any).meta.data} /> : null;
            })()}
            <div className="text-xs text-neutral-600 mt-2">{(item as any).meta?.summary}</div>
          </div>
        )}
        {errorMessage ? (
          <div className="mt-3 inline-flex items-center gap-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{errorMessage}</span>
          </div>
        ) : null}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onRemix} disabled={isRunning}>
          <RefreshCw className="h-4 w-4 mr-1" />Remix
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownload} disabled={isRunning}>
          <ArrowDownToLine className="h-4 w-4 mr-1" />Download
        </Button>
        <Button variant="ghost" size="sm" onClick={handleShare} disabled={isRunning}>
          <Share2 className="h-4 w-4 mr-1" />{copied ? 'Copied' : 'Share'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="ml-auto text-red-600 hover:bg-red-600/10">
          <Trash2 className="h-4 w-4 mr-1" />Delete
        </Button>
      </div>
    </div>
  );
}


