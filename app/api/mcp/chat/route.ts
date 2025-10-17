import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';
import { connectorMap } from '@/lib/connectors/connectors-config';

export const runtime = 'nodejs';

type ConnectorPayload = {
  id: string;
  data: any;
};

function formatValue(value: unknown, depth = 0): string {
  if (value === null || value === undefined) return String(value);
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        const formatted = formatValue(entry, depth + 1);
        if (formatted.includes('\n')) {
          const lines = formatted.split('\n');
          return lines
            .map((line, index) => `${index === 0 ? '- ' : '  '}${line}`)
            .join('\n');
        }
        return `- ${formatted}`;
      })
      .join('\n');
  }
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, val]) => {
        const formatted = formatValue(val, depth + 1);
        if (formatted.includes('\n')) {
          const indent = '  '.repeat(depth + 1);
          return `${key}:\n${formatted
            .split('\n')
            .map((line) => `${indent}${line}`)
            .join('\n')}`;
        }
        return `${key}: ${formatted}`;
      })
      .join('\n');
  }
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
}

function buildConnectorContext(connectors: ConnectorPayload[]): string {
  const blocks: string[] = [];
  connectors.forEach(({ id, data }) => {
    if (!data) return;
    const connector = connectorMap[id];
    if (!connector) return;
    const formatted = typeof data === 'object' ? formatValue(data) : String(data);
    blocks.push(`[${connector.name} Connector Data]:\n${formatted}`);
  });
  return blocks.join('\n\n');
}

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return okJson({ error: 'missing_api_key' }, 401);
  }
  const { messages = [], connectors = [], model = 'gpt-4.1-mini' } = await req.json();
  const context = buildConnectorContext(connectors as ConnectorPayload[]);
  const system = context
    ? `You are a solutions engineering assistant guiding a product demo. Leverage the following connector context to answer precisely.\n\n${context}`
    : 'You are a solutions engineering assistant guiding a product demo.';

  const client = new OpenAI({ apiKey });
  const response = await client.responses.create({
    model,
    input: [
      { role: 'system', content: system },
      ...(messages || [])
    ]
  });
  const output = ((response as any).output || []) as any[];
  const textPart = output.flatMap((entry: any) => (entry?.content ? entry.content : [])).find((part: any) => part?.type === 'output_text');
  const content = textPart?.text || '';
  return okJson({ message: { role: 'assistant', content } });
}
