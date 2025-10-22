import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AnyHistoryItem, HistoryItemBase } from '@/types/history';

type Namespace =
  | 'image-gen'
  | 'video-gen'
  | 'realtime'
  | 'knowledge-assistant'
  | 'embeddings-search'
  | 'structured-output'
  | 'support-bot'
  | 'forecasting'
  | 'other';

export type HistoryNamespace = Namespace;

interface HistoryState {
  itemsByNs: Record<Namespace, AnyHistoryItem[]>;
  add: (ns: Namespace, item: AnyHistoryItem) => void;
  remove: (ns: Namespace, id: string) => void;
  clear: (ns: Namespace) => void;
  replace: (ns: Namespace, id: string, next: AnyHistoryItem) => void;
  cloneToPrompt?: (ns: Namespace, item: AnyHistoryItem) => void; // assigned by pages
}

const empty: Record<Namespace, AnyHistoryItem[]> = {
  'image-gen': [],
  'video-gen': [],
  realtime: [],
  'knowledge-assistant': [],
  'embeddings-search': [],
  'structured-output': [],
  'support-bot': [],
  forecasting: [],
  other: []
};

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      itemsByNs: empty,
      add: (ns, item) =>
        set((s) => ({ itemsByNs: { ...s.itemsByNs, [ns]: [item, ...(s.itemsByNs[ns] ?? [])] } })),
      remove: (ns, id) =>
        set((s) => ({ itemsByNs: { ...s.itemsByNs, [ns]: (s.itemsByNs[ns] ?? []).filter((i) => i.id !== id) } })),
      replace: (ns, id, next) =>
        set((s) => ({
          itemsByNs: {
            ...s.itemsByNs,
            [ns]: (s.itemsByNs[ns] ?? []).map((i) => (i.id === id ? next : i))
          }
        })),
      clear: (ns) => set((s) => ({ itemsByNs: { ...s.itemsByNs, [ns]: [] } }))
    }),
    {
      name: 'history-store',
      version: 2,
      partialize: (state) => ({
        itemsByNs: {
          ...state.itemsByNs,
          'image-gen': []
        }
      }),
      migrate: (persisted, version) => {
        if (!persisted) return persisted;
        if ((version ?? 0) < 2) {
          return {
            ...persisted,
            itemsByNs: {
              ...persisted.itemsByNs,
              'image-gen': []
            }
          };
        }
        return persisted;
      }
    }
  )
);

export function isRunning(item: HistoryItemBase) {
  return item.status === 'running';
}

