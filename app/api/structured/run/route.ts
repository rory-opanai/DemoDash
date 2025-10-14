import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';
import { runStructuredOutput } from '@/mocks/structuredOutput.mock';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const { messages, schemaId, useTools } = await req.json();
  const map: Record<string, any> = {
    contractSummary: 'Contract Summary',
    salesForecast: 'Sales Forecast Object',
    piiExtract: 'PII Extract'
  };
  if (!map[schemaId]) {
    return new Response(JSON.stringify({ error: 'invalid_schema', message: 'schemaId must be contractSummary|salesForecast|piiExtract' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const last = messages[messages.length-1];
  const json = await runStructuredOutput(map[schemaId]);
  const content = `Here is the ${schemaId} object for: ${last?.content ?? ''}`;
  return okJson({ message: { role: 'assistant', content, json, tool_calls: useTools ? [{ id: 'tool_1', type: 'mock' }] : undefined } });
}


