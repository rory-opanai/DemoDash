"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';
import { indexVectors } from '@/lib/embeddingsStore';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing X-OPENAI-KEY header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { corpusId, docs, model = 'text-embedding-3-small' } = await req.json();
  if (!Array.isArray(docs) || docs.length === 0) {
    return new Response(JSON.stringify({ error: 'no_documents', message: 'docs array required' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const client = new OpenAI({ apiKey });
  const embeddings = await client.embeddings.create({ model, input: docs.map((doc: any) => doc.text) });
  const vectors = embeddings.data.map((item, index) => ({
    id: docs[index]?.id || `doc_${index}`,
    text: docs[index]?.text,
    embedding: item.embedding as number[],
    meta: docs[index]?.meta || {}
  }));
  indexVectors({ corpusId, vectors });
  return okJson({ count: vectors.length });
}


