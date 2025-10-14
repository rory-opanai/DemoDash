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

  const { prompt, history = [], model = 'gpt-4o-mini', voice = 'verse' } = body || {};
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return new Response(JSON.stringify({ error: 'invalid_prompt', message: 'Prompt is required.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }

  const client = new OpenAI({ apiKey });
  try {
    const response = await client.responses.create({
      model,
      input: [
        { role: 'system', content: 'You are a realtime multimodal assistant. Keep responses concise and reference uploaded context when provided.' },
        ...history,
        { role: 'user', content: prompt }
      ]
    });
    const output = ((response as any).output || []) as any[];
    const textPart = output.flatMap((entry: any) => (entry?.content ? entry.content : [])).find((part: any) => part?.type === 'output_text');
    const text = textPart?.text?.trim() || '';

    let audioBase64 = '';
    let audioMime = 'audio/mpeg';
    if (text) {
      const speech = await client.audio.speech.create({
        model: 'gpt-4o-mini-tts',
        voice,
        input: text,
        response_format: 'mp3'
      });
      const arrayBuffer = await speech.arrayBuffer();
      audioBase64 = Buffer.from(arrayBuffer).toString('base64');
    }

    return okJson({ text, audio: audioBase64, audioMime });
  } catch (error: unknown) {
    console.error('Realtime response failed', error);
    const message = error instanceof Error ? error.message : 'Realtime response failed.';
    const status = (error as any)?.status ?? 500;
    return new Response(JSON.stringify({ error: 'realtime_response_failed', message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}
