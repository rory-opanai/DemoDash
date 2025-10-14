export const structuredSchemas = {
  contractSummary: {
    type: 'object',
    properties: {
      contractId: { type: 'string' },
      parties: { type: 'array', items: { type: 'string' } },
      startDate: { type: 'string', format: 'date' },
      endDate: { type: 'string', format: 'date' },
      renewal: { type: 'boolean' }
    },
    required: ['contractId', 'parties', 'startDate']
  },
  salesForecast: {
    type: 'object',
    properties: {
      region: { type: 'string' },
      timeframe: { type: 'string', enum: ['weekly', 'monthly', 'quarterly'] },
      pipelineAmount: { type: 'number' },
      confidence: { type: 'number', minimum: 0, maximum: 1 }
    },
    required: ['region', 'timeframe', 'pipelineAmount']
  },
  piiExtract: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string' },
      phone: { type: 'string' }
    },
    required: ['name']
  }
} as const;

export type StructuredSchemaId = keyof typeof structuredSchemas;
