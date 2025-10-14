"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing X-OPENAI-KEY header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const form = await req.formData();
  const files = form.getAll('files') as File[];
  const limit = 25 * 1024 * 1024;
  for (const f of files) {
    if (f.size > limit) {
      return new Response(JSON.stringify({ error: 'file_too_large', message: `Max size 25MB per file` }), { status: 413, headers: { 'Content-Type': 'application/json' } });
    }
  }
  const client = new OpenAI({ apiKey });
  const uploads = [];
  for (const f of files) {
    const buffer = Buffer.from(await f.arrayBuffer());
    const openaiFile = await client.files.create({
      file: await OpenAI.toFile(buffer, f.name),
      purpose: 'assistants'
    });
    uploads.push({
      fileId: openaiFile.id,
      filename: openaiFile.filename,
      bytes: openaiFile.bytes,
      createdAt: new Date((openaiFile.created_at || Date.now() / 1000) * 1000).toISOString()
    });
  }
  return okJson({ items: uploads });
}


