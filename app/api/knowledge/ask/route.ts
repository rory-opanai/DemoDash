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
  const { messages, guardrails, fileIds = [], tone = 'neutral', model = 'gpt-4.1-mini' } = await req.json();
  if (guardrails && fileIds.length === 0) {
    return new Response(JSON.stringify({ error: 'guardrails_no_files', message: 'guardrails=true requires fileIds' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const client = new OpenAI({ apiKey });

  let sources = '';
  if (fileIds.length) {
    const contents = await Promise.all(
      fileIds.map(async (fileId: string, idx: number) => {
        try {
          const file = await client.files.content(fileId);
          const text = await file.text();
          return `Source ${idx + 1} (${fileId}):\n${text}`;
        } catch (err) {
          return `Source ${idx + 1} (${fileId}): [unavailable]`;
        }
      })
    );
    sources = contents.join("\n\n");
  }

  const latest = messages?.[messages.length - 1]?.content || '';
  const question = guardrails && sources
    ? `Use the provided sources to answer. If the answer cannot be derived, respond that the information is unavailable.\n\n${sources}\n\nQuestion: ${latest}`
    : latest;

  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: `You are a ${tone} knowledge assistant. Cite sources inline when possible.` },
      { role: 'user', content: question }
    ]
  });
  const output = ((response as any).output || []) as any[];
  const contentPart = output.flatMap((entry: any) => (entry?.content ? entry.content : [])).find((part: any) => part?.type === 'output_text');
  return okJson({ message: { role: 'assistant', content: contentPart?.text || '', citations: [] } });
}


