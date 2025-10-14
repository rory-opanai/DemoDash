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

  const form = await req.formData();
  const file = form.get('audio');
  if (!(file instanceof Blob)) {
    return new Response(JSON.stringify({ error: 'invalid_audio', message: 'Expected audio file upload.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const client = new OpenAI({ apiKey });
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const transcription = await client.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, 'recording.webm'),
      model: 'whisper-1'
    });
    return okJson({ text: transcription.text?.trim() ?? '' });
  } catch (error: unknown) {
    console.error('Transcription failed', error);
    const message = error instanceof Error ? error.message : 'Transcription failed.';
    const status = (error as any)?.status ?? 500;
    return new Response(JSON.stringify({ error: 'transcription_failed', message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}
