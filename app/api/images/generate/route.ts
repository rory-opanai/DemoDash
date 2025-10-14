"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const client = new OpenAI({ apiKey });
  const { prompt, size = '1024x1024', versions = 1 } = await req.json();
  const n = Math.min(Math.max(Number(versions) || 1, 1), 4);
  const response = await client.images.generate({
    prompt,
    size,
    n,
    response_format: 'b64_json'
  });
  const now = new Date().toISOString();
  const items = (response.data || []).map((item, index) => ({
    id: `img_${index}_${Math.random().toString(36).slice(2)}`,
    previewUrl: `data:image/png;base64,${item.b64_json}`,
    createdAt: now,
    model: 'gpt-image'
  }));
  return okJson({ items });
}


