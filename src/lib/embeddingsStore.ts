type StoredVector = {
  id: string;
  text: string;
  embedding: number[];
  meta?: Record<string, unknown>;
};

const corpora = new Map<string, StoredVector[]>();

type IndexInput = {
  corpusId: string;
  vectors: StoredVector[];
};

export function indexVectors({ corpusId, vectors }: IndexInput) {
  const existing = corpora.get(corpusId) || [];
  corpora.set(corpusId, [...existing, ...vectors]);
  return corpora.get(corpusId) || [];
}

export function getCorpus(corpusId: string) {
  return corpora.get(corpusId) || [];
}

export function cosineSimilarity(a: number[], b: number[]) {
  const dot = a.reduce((sum, val, idx) => sum + val * (b[idx] || 0), 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  if (!magA || !magB) return 0;
  return dot / (magA * magB);
}
