"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';
import { structuredSchemas, type StructuredSchemaId } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { messages, schemaId, useTools, model = 'gpt-4.1-mini' } = await req.json();
  if (!structuredSchemas[schemaId as StructuredSchemaId]) {
    return new Response(JSON.stringify({ error: 'invalid_schema', message: 'schemaId must be contractSummary|salesForecast|piiExtract' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const client = new OpenAI({ apiKey });
  const schema = structuredSchemas[schemaId as StructuredSchemaId];
  const system = useTools
    ? 'You are a tool-using assistant. Call tools when appropriate.'
    : 'You are an assistant that produces structured JSON answers.';
  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: `${system} Use the following JSON schema and respond with a single JSON object:\n${JSON.stringify(schema)}` },
      ...messages
    ]
  });
  const output = ((response as any).output || []) as any[];
  const textPart = output.flatMap((entry: any) => (entry?.content ? entry.content : [])).find((part: any) => part?.type === 'output_text');
  let parsed: unknown = {};
  if (textPart?.text) {
    try {
      parsed = JSON.parse(textPart.text);
    } catch (err) {
      parsed = { error: 'Failed to parse JSON', raw: textPart.text };
    }
  }
  return okJson({ message: { role: 'assistant', content: textPart?.text || '', json: parsed } });
}


