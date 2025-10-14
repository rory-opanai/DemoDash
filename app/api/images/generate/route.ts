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

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'invalid_json', message: 'Request body must be valid JSON.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const {
    prompt,
    size = '1024x1024',
    versions = 1,
    model = 'gpt-image-1',
    quality = 'auto',
    background,
    outputFormat
  } = body || {};

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return new Response(JSON.stringify({ error: 'invalid_prompt', message: 'Provide a non-empty prompt string.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const n = Math.min(Math.max(Number(versions) || 1, 1), 4);
  const client = new OpenAI({ apiKey });

  try {
    const response = await client.images.generate({
      prompt,
      size,
      n,
      model,
      quality,
      background,
      response_format: model === 'gpt-image-1' ? 'b64_json' : 'url',
      output_format: outputFormat
    });

    const now = new Date().toISOString();
    const items = (response.data || []).map((item, index) => {
      const id = `img_${index}_${Math.random().toString(36).slice(2)}`;
      if (item.b64_json) {
        const mime = outputFormat ? `image/${outputFormat}` : 'image/png';
        return {
          id,
          previewUrl: `data:${mime};base64,${item.b64_json}`,
          createdAt: now,
          model
        };
      }
      return {
        id,
        previewUrl: item.url,
        createdAt: now,
        model
      };
    });
    return okJson({ items, model });
  } catch (err: unknown) {
    console.error('Image generation failed', err);
    const message = err instanceof Error ? err.message : 'Unknown error generating image';
    const status = (err as any)?.status ?? 500;
    return new Response(JSON.stringify({ error: 'image_generation_failed', message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}


