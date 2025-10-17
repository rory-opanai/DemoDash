"use server";
import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

interface Opportunity {
  id: string;
  name?: string;
  amount: number;
  closeDate: string;
  stage?: string;
  probability?: number;
}

interface ForecastSeriesPoint {
  period: string;
  pipeline?: number;
  forecast: number;
}

interface SalesForecastResult {
  summary: string;
  series: ForecastSeriesPoint[];
  recommendations?: string[];
  confidence?: string;
  horizon: string;
  model: string;
  generatedAt: string;
  totals: { pipeline: number; forecast: number };
}

class ConnectorError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 503) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const FORECAST_SCHEMA = {
  name: 'sales_forecast',
  schema: {
    type: 'object',
    properties: {
      summary: { type: 'string' },
      confidence: { type: 'string' },
      recommendations: {
        type: 'array',
        items: { type: 'string' }
      },
      series: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            period: { type: 'string' },
            pipeline: { type: 'number' },
            forecast: { type: 'number' }
          },
          required: ['period', 'forecast']
        }
      }
    },
    required: ['summary', 'series']
  },
  strict: true
} as const;

const STAGE_DEFAULT_PROB: Record<string, number> = {
  prospecting: 0.2,
  qualification: 0.3,
  proposal: 0.45,
  'value proposition': 0.5,
  negotiation: 0.65,
  'closed won': 1,
  'closed lost': 0
};

const SAMPLE_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'op-1001',
    name: 'Acme Corp Expansion',
    amount: 185000,
    closeDate: new Date().toISOString(),
    stage: 'negotiation',
    probability: 0.65
  },
  {
    id: 'op-1002',
    name: 'Globex Renewal',
    amount: 92000,
    closeDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
    stage: 'proposal',
    probability: 0.5
  },
  {
    id: 'op-1003',
    name: 'Initech Upsell',
    amount: 143000,
    closeDate: new Date(new Date().setMonth(new Date().getMonth() + 2)).toISOString(),
    stage: 'qualification',
    probability: 0.35
  },
  {
    id: 'op-1004',
    name: 'Soylent Co-Delivery',
    amount: 76000,
    closeDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString(),
    stage: 'prospecting',
    probability: 0.2
  }
];

function pickProbability(op: Opportunity) {
  if (typeof op.probability === 'number') {
    return Math.max(0, Math.min(1, op.probability));
  }
  const stage = op.stage?.toLowerCase() ?? '';
  if (stage in STAGE_DEFAULT_PROB) {
    return STAGE_DEFAULT_PROB[stage];
  }
  return 0.35;
}

function formatPeriodLabel(date: Date, horizon: string) {
  if (horizon === 'month') {
    return date.toLocaleString('en-US', { month: 'short', year: 'numeric' });
  }
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()} Q${quarter}`;
}

function periodKey(date: Date, horizon: string) {
  if (horizon === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  return `${date.getFullYear()}-Q${quarter}`;
}

function aggregatePipeline(opportunities: Opportunity[], horizon: string) {
  const groups = new Map<string, { label: string; pipeline: number; weighted: number }>();
  opportunities.forEach((op) => {
    if (!op.amount || !op.closeDate) return;
    const closeDate = new Date(op.closeDate);
    if (Number.isNaN(closeDate.getTime())) return;
    const key = periodKey(closeDate, horizon);
    const label = formatPeriodLabel(closeDate, horizon);
    const current = groups.get(key) || { label, pipeline: 0, weighted: 0 };
    const probability = pickProbability(op);
    current.pipeline += op.amount;
    current.weighted += op.amount * probability;
    groups.set(key, current);
  });
  return Array.from(groups.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({ key, ...value }));
}

async function getSalesforcePipelineData(): Promise<Opportunity[]> {
  const endpoint = process.env.SALESFORCE_MCP_ENDPOINT;
  const token = process.env.SALESFORCE_MCP_TOKEN;
  if (!endpoint) {
    const allowDemo = process.env.SALESFORCE_MCP_ENABLE_DEMO === 'true';
    if (allowDemo) {
      return SAMPLE_OPPORTUNITIES;
    }
    throw new ConnectorError('connector_unconfigured', 'Live Salesforce data is not configured.');
  }
  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json'
      }
    });
    if (!res.ok) {
      throw new ConnectorError('connector_error', `Salesforce MCP returned ${res.status}`, res.status);
    }
    const payload = await res.json();
    const opportunities = Array.isArray(payload?.opportunities) ? payload.opportunities : [];
    if (!opportunities.length) {
      throw new ConnectorError('connector_empty', 'Salesforce did not return any open opportunities.', 200);
    }
    return opportunities as Opportunity[];
  } catch (err) {
    if (err instanceof ConnectorError) throw err;
    throw new ConnectorError('connector_error', 'Failed to fetch Salesforce pipeline data.');
  }
}

function fallbackSummary(aggregated: ReturnType<typeof aggregatePipeline>, horizon: string) {
  if (!aggregated.length) {
    return 'No open opportunities were returned from Salesforce.';
  }
  const totalPipeline = aggregated.reduce((acc, item) => acc + item.pipeline, 0);
  const totalForecast = aggregated.reduce((acc, item) => acc + item.weighted, 0);
  const label = horizon === 'month' ? 'months' : 'quarters';
  return `Projected revenue across the next ${aggregated.length} ${label} totals $${Math.round(totalForecast).toLocaleString()} with $${Math.round(totalPipeline).toLocaleString()} currently in pipeline.`;
}

function normaliseSeries(series: any, fallback: ReturnType<typeof aggregatePipeline>): ForecastSeriesPoint[] {
  if (!Array.isArray(series)) {
    return fallback.map((item) => ({ period: item.label, pipeline: Math.round(item.pipeline), forecast: Math.round(item.weighted) }));
  }
  const cleaned = series
    .map((point: any) => ({
      period: typeof point?.period === 'string' ? point.period : '',
      pipeline: typeof point?.pipeline === 'number' ? point.pipeline : undefined,
      forecast: typeof point?.forecast === 'number' ? point.forecast : Number.NaN
    }))
    .filter((point) => point.period && Number.isFinite(point.forecast));
  if (!cleaned.length) {
    return fallback.map((item) => ({ period: item.label, pipeline: Math.round(item.pipeline), forecast: Math.round(item.weighted) }));
  }
  return cleaned.map((point) => ({
    period: point.period,
    pipeline: typeof point.pipeline === 'number' ? point.pipeline : undefined,
    forecast: Math.round(point.forecast)
  }));
}

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const { horizon = 'quarter', model = 'gpt-4.1-mini' } = await req.json().catch(() => ({ horizon: 'quarter', model: 'gpt-4.1-mini' }));

  let opportunities: Opportunity[] = [];
  try {
    opportunities = await getSalesforcePipelineData();
  } catch (err) {
    if (err instanceof ConnectorError) {
      return okJson({ error: err.code, message: err.message }, err.status === 200 ? 200 : err.status);
    }
    return okJson({ error: 'connector_error', message: 'Failed to load Salesforce data.' }, 503);
  }

  const aggregated = aggregatePipeline(opportunities, horizon);
  if (!aggregated.length) {
    return okJson({
      error: 'no_pipeline_data',
      message: 'No upcoming opportunities were found in Salesforce.'
    });
  }

  const client = new OpenAI({ apiKey });
  const forecastInput = aggregated.map((item) => ({
    period: item.label,
    pipeline: Math.round(item.pipeline),
    weightedForecast: Math.round(item.weighted)
  }));

  const prompt = `You are a sales operations analyst. Given weighted pipeline data grouped by ${horizon === 'month' ? 'month' : 'quarter'}, provide a short narrative and adjust the weighted forecast if necessary. Highlight trends and call out any risks or upsides. Return JSON that matches the provided schema. All currency values are in USD.\n\nWeighted pipeline data:\n${JSON.stringify(forecastInput, null, 2)}\n\nIf you adjust a forecast value, ensure it remains numerically close to the weighted forecast.`;

  let aiSummary = '';
  let aiSeries: ForecastSeriesPoint[] = [];
  let aiConfidence: string | undefined;
  let aiRecommendations: string[] | undefined;
  let usedModel = model;

  try {
    const response = await client.responses.create({
      model,
      input: [
        { role: 'system', content: 'You are an expert sales forecaster. Respond in JSON only.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_schema', json_schema: FORECAST_SCHEMA as any }
    });
    usedModel = (response as any).model || model;
    const output = ((response as any).output || []) as any[];
    const textPart = output
      .flatMap((entry: any) => (entry?.content ? entry.content : []))
      .find((part: any) => part?.type === 'output_text');
    if (textPart?.text) {
      try {
        const parsed = JSON.parse(textPart.text);
        aiSummary = typeof parsed?.summary === 'string' ? parsed.summary : '';
        aiSeries = normaliseSeries(parsed?.series, aggregated);
        if (Array.isArray(parsed?.recommendations)) {
          aiRecommendations = parsed.recommendations.filter((item: unknown) => typeof item === 'string');
        }
        if (typeof parsed?.confidence === 'string') {
          aiConfidence = parsed.confidence;
        }
      } catch (err) {
        aiSummary = '';
        aiSeries = normaliseSeries(undefined, aggregated);
      }
    } else {
      aiSeries = normaliseSeries(undefined, aggregated);
    }
  } catch (err) {
    console.warn('Forecasting prompt failed, using weighted pipeline', err);
    aiSeries = normaliseSeries(undefined, aggregated);
  }

  if (!aiSummary) {
    aiSummary = fallbackSummary(aggregated, horizon);
  }

  const totals = aiSeries.reduce(
    (acc, item) => {
      acc.pipeline += item.pipeline ?? 0;
      acc.forecast += item.forecast ?? 0;
      return acc;
    },
    { pipeline: 0, forecast: 0 }
  );

  const responseBody: SalesForecastResult = {
    summary: aiSummary,
    series: aiSeries,
    recommendations: aiRecommendations,
    confidence: aiConfidence,
    horizon,
    model: usedModel,
    generatedAt: new Date().toISOString(),
    totals: {
      pipeline: Math.round(totals.pipeline),
      forecast: Math.round(totals.forecast)
    }
  };

  return okJson(responseBody);
}


