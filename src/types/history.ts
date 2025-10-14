export type HistoryKind = 'image' | 'video' | 'json' | 'text' | 'chart' | 'session';

export interface HistoryItemBase {
  id: string;
  kind: HistoryKind;
  title: string;
  model?: string;
  createdAt: string; // ISO
  status: 'ready' | 'running' | 'failed';
  meta?: Record<string, unknown>;
}

export interface ImageHistoryItem extends HistoryItemBase {
  kind: 'image';
  previewUrl: string; // local blob or placeholder
}

export interface VideoHistoryItem extends HistoryItemBase {
  kind: 'video';
  previewUrl: string;
  durationSec?: number;
}

export interface JsonHistoryItem extends HistoryItemBase {
  kind: 'json';
  json: unknown;
}

export type AnyHistoryItem = ImageHistoryItem | VideoHistoryItem | JsonHistoryItem | (HistoryItemBase & { kind: 'text' | 'chart' | 'session' });


