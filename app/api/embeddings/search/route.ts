"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';
import { getCorpus, cosineSimilarity } from '@/lib/embeddingsStore';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing X-OPENAI-KEY header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { corpusId, query, topK = 3, model = 'text-embedding-3-small' } = await req.json();
  const corpus = getCorpus(corpusId);
  if (!corpus.length) {
    return new Response(JSON.stringify({ error: 'empty_corpus', message: 'No documents indexed for this corpus' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  }
  const client = new OpenAI({ apiKey });
  const queryEmbedding = await client.embeddings.create({ model, input: [query] });
  const embeddingVector = queryEmbedding.data?.[0]?.embedding as number[] | undefined;
  if (!embeddingVector) {
    return new Response(JSON.stringify({ error: 'embedding_failed', message: 'Failed to compute query embedding.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
  const scored = corpus
    .map((doc) => ({ ...doc, score: cosineSimilarity(embeddingVector, doc.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ id, text, score, meta }) => ({ id, text, score, meta }));
  return okJson({ results: scored });
}


