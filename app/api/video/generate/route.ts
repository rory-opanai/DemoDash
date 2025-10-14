"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

const ALLOWED_SECONDS = ['4', '8', '12'] as const;
const ALLOWED_SIZES = ['720x1280', '1280x720', '1024x1792', '1792x1024'] as const;
const ALLOWED_MODELS = ['sora-2', 'sora-2-pro'] as const;

type SecondsOption = (typeof ALLOWED_SECONDS)[number];
type SizeOption = (typeof ALLOWED_SIZES)[number];
type ModelOption = (typeof ALLOWED_MODELS)[number];

type GenerateBody = {
  prompt: string;
  model?: ModelOption;
  seconds?: SecondsOption | number;
  size?: SizeOption;
};

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key', message: 'Provide X-OPENAI-KEY header.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  let body: GenerateBody;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'invalid_json', message: 'Request body must be valid JSON.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const prompt = body.prompt?.trim();
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'invalid_prompt', message: 'Prompt is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const seconds = (() => {
    const raw = body.seconds ?? '8';
    const normalized = typeof raw === 'number' ? raw.toString() : raw;
    return (ALLOWED_SECONDS.includes(normalized as SecondsOption) ? normalized : '8') as SecondsOption;
  })();
  const size = (body.size && ALLOWED_SIZES.includes(body.size as SizeOption) ? body.size : '1280x720') as SizeOption;
  const model = (body.model && ALLOWED_MODELS.includes(body.model as ModelOption) ? body.model : 'sora-2') as ModelOption;

  const client = new OpenAI({ apiKey });
  try {
    const job = await client.videos.create({
      prompt,
      model,
      seconds,
      size
    });
    return okJson({ job });
  } catch (err: unknown) {
    console.error('Video generation request failed', err);
    const message = err instanceof Error ? err.message : 'Unknown error creating video job';
    const status = (err as any)?.status ?? 500;
    return new Response(JSON.stringify({ error: 'video_generation_failed', message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}


