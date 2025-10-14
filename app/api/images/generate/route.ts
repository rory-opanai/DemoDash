import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const { prompt, size = '1024x1024', seed, versions = 1, imageFileIds } = await req.json();
  const allowed = ['512x512','768x768','1024x1024'];
  if (!allowed.includes(size)) {
    return new Response(JSON.stringify({ error: 'invalid_size', message: `size must be one of ${allowed.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const n = Math.min(Math.max(parseInt(versions, 10) || 1, 1), 4);
  const items = Array.from({ length: n }).map((_, i) => ({
    id: `img_${Math.random().toString(36).slice(2,10)}`,
    url: '/placeholders/image-1.svg',
    model: 'gpt-image-mock',
    seed,
    createdAt: new Date().toISOString(),
  }));
  const meta: any = {};
  if (imageFileIds?.length) meta.ignoredReferenceImages = true;
  return okJson({ items, meta });
}


