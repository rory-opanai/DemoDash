import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key', message: 'Provide X-OPENAI-KEY header.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { model = 'gpt-4o-realtime-preview', instructions } = await req.json().catch(() => ({}));
  const body = {
    model,
    voice: 'verse',
    instructions: instructions || 'You are a realtime assistant.'
  };
  const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    return new Response(JSON.stringify(json), { status: response.status, headers: { 'Content-Type': 'application/json' } });
  }
  return okJson(json);
}


