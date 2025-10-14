"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

const GPT_IMAGE_MODELS = new Set(['gpt-image-1']);
const URL_BASED_MODELS = new Set(['dall-e-2', 'dall-e-3']);

type GenerateBody = {
  prompt: string;
  size?: string;
  versions?: number;
  model?: string;
  quality?: string;
  background?: string;
  outputFormat?: string;
};

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: GenerateBody;
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
    const request: Record<string, unknown> = {
      prompt,
      size,
      n,
      model,
      quality
    };

    if (background && GPT_IMAGE_MODELS.has(model)) {
      request['background'] = background;
    }

    if (outputFormat && GPT_IMAGE_MODELS.has(model)) {
      request['output_format'] = outputFormat;
    }

    if (URL_BASED_MODELS.has(model)) {
      request['response_format'] = 'url';
    }

    const response = await client.images.generate(request as any);

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


