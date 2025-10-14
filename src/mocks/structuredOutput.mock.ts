import { sleep } from "@/lib/utils";

export type SchemaName = 'Contract Summary' | 'Sales Forecast Object' | 'PII Extract';

export function getSchemas() {
  return {
    'Contract Summary': {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        parties: { type: 'array', items: { type: 'string' } },
        startDate: { type: 'string', format: 'date' },
        endDate: { type: 'string', format: 'date' },
        renewal: { type: 'boolean' }
      },
      required: ['contractId', 'parties']
    },
    'Sales Forecast Object': {
      type: 'object',
      properties: {
        region: { type: 'string' },
        timeframe: { type: 'string', enum: ['weekly', 'monthly', 'quarterly'] },
        pipelineAmount: { type: 'number' },
        confidence: { type: 'number' }
      }
    },
    'PII Extract': {
      type: 'object',
      properties: {
        name: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' }
      }
    }
  } as const;
}

export async function runStructuredOutput(schema: SchemaName) {
  await sleep(800);
  switch (schema) {
    case 'Contract Summary':
      return { contractId: 'C-00123', parties: ['Acme Inc', 'Globex LLC'], startDate: '2025-01-01', endDate: '2026-01-01', renewal: true };
    case 'Sales Forecast Object':
      return { region: 'North America', timeframe: 'monthly', pipelineAmount: 1250000, confidence: 0.72 };
    default:
      return { name: 'Jane Doe', email: 'jane@example.com', phone: '+1-555-231-8899' };
  }
}


