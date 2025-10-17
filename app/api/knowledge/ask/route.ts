"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

interface FileReference {
  fileId: string;
  filename: string;
}

function extractCitations(text: string, files: FileReference[]) {
  const regex = /source\s*(\d+)/gi;
  const seen = new Set<string>();
  const citations: { fileId: string; title: string }[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text))) {
    const index = Number(match[1]) - 1;
    if (!Number.isFinite(index) || index < 0 || index >= files.length) continue;
    const ref = files[index];
    if (seen.has(ref.fileId)) continue;
    seen.add(ref.fileId);
    citations.push({ fileId: ref.fileId, title: ref.filename });
  }
  return citations;
}

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing X-OPENAI-KEY header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { messages = [], guardrails, fileIds = [], tone = 'neutral', model = 'gpt-4.1-mini' } = await req.json();
  if (guardrails && fileIds.length === 0) {
    return new Response(JSON.stringify({ error: 'guardrails_no_files', message: 'guardrails=true requires fileIds' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const client = new OpenAI({ apiKey });

  let sources = '';
  const fileRefs: FileReference[] = [];
  if (fileIds.length) {
    const entries = await Promise.all(
      fileIds.map(async (fileId: string, idx: number) => {
        try {
          const [meta, contentRes] = await Promise.all([
            client.files.retrieve(fileId),
            client.files.content(fileId)
          ]);
          const text = await contentRes.text();
          const filename = (meta as any)?.filename || `file-${idx + 1}`;
          fileRefs.push({ fileId, filename });
          return `Source ${idx + 1} (${filename} · ${fileId}):\n${text}`;
        } catch (err) {
          const fallbackName = `file-${idx + 1}`;
          fileRefs.push({ fileId, filename: fallbackName });
          return `Source ${idx + 1} (${fallbackName} · ${fileId}): [unavailable]`;
        }
      })
    );
    sources = entries.join("\n\n");
  }

  const latest = messages?.[messages.length - 1]?.content || '';
  const instructions = guardrails
    ? 'Rely exclusively on the provided sources. If the answer cannot be derived, say you do not have the information.'
    : 'Reference the provided sources when relevant. If no sources apply, answer from general knowledge.';

  const question = sources
    ? `${instructions}\n\nSources:\n${sources}\n\nQuestion: ${latest}`
    : latest;

  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: `You are a ${tone} knowledge assistant. Cite sources inline when possible.` },
      ...messages.slice(0, -1),
      { role: 'user', content: question }
    ]
  });
  const output = ((response as any).output || []) as any[];
  const contentPart = output.flatMap((entry: any) => (entry?.content ? entry.content : [])).find((part: any) => part?.type === 'output_text');
  const contentText = contentPart?.text || '';
  const citations = contentText ? extractCitations(contentText, fileRefs) : [];
  return okJson({ message: { role: 'assistant', content: contentText, citations } });
}


