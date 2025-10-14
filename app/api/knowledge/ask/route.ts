import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';
import { askWithCitations } from '@/mocks/knowledge.mock';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const { messages, guardrails, fileIds } = await req.json();
  if (guardrails && (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0)) {
    return new Response(JSON.stringify({ error: 'guardrails_no_files', message: 'guardrails=true requires fileIds' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const last = messages[messages.length - 1];
  const res = await askWithCitations(last?.content || '', fileIds || []);
  return okJson({ message: { role: 'assistant', content: res.answer, citations: res.citations } });
}


