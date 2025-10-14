"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

export async function GET(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing X-OPENAI-KEY header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const client = new OpenAI({ apiKey });
  const list = await client.files.list({ purpose: 'assistants' });
  const items = (list.data || []).map((file) => ({
    fileId: file.id,
    filename: file.filename,
    bytes: file.bytes,
    createdAt: new Date((file.created_at || Date.now() / 1000) * 1000).toISOString()
  }));
  return okJson({ items });
}


