import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard } from '@/lib/api';

const VALID_VARIANTS = new Set(['video', 'thumbnail', 'spritesheet']);

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const err = byokGuard(req);
  if (err) return err;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(req.url);
  const variant = url.searchParams.get('variant') || 'video';
  if (!VALID_VARIANTS.has(variant)) {
    return new Response(JSON.stringify({ error: 'invalid_variant', message: 'Variant must be video|thumbnail|spritesheet.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const client = new OpenAI({ apiKey });
  try {
    const upstream = await client.videos.downloadContent(params.jobId, { variant: variant as 'video' | 'thumbnail' | 'spritesheet' });
    if (!upstream.ok) {
      const text = await upstream.text();
      return new Response(text, { status: upstream.status, headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' } });
    }
    const arrayBuffer = await upstream.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = upstream.headers.get('content-type') || (variant === 'thumbnail' ? 'image/png' : 'video/mp4');
    const contentLength = buffer.length.toString();
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': contentLength,
        'Cache-Control': 'no-store'
      }
    });
  } catch (error: unknown) {
    console.error('Failed to download video content', error);
    const message = error instanceof Error ? error.message : 'Unable to download video content.';
    const status = (error as any)?.status ?? 500;
    return new Response(JSON.stringify({ error: 'video_download_failed', message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}
