import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  const limit = 25 * 1024 * 1024;
  for (const f of files) {
    if (f.size > limit) {
      return new Response(JSON.stringify({ error: 'file_too_large', message: `Max size 25MB per file` }), { status: 413, headers: { 'Content-Type': 'application/json' } });
    }
  }
  const items = files.map((f) => ({ fileId: `file_${Math.random().toString(36).slice(2,10)}`, filename: f.name, bytes: f.size, createdAt: new Date().toISOString() }));
  return okJson({ items });
}


