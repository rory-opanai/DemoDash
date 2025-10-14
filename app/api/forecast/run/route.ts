import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';
import { getForecastData } from '@/mocks/forecast.mock';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const { period = 'monthly', region = 'Global' } = await req.json();
  const allowed = ['weekly','monthly','quarterly'];
  if (!allowed.includes(period)) {
    return new Response(JSON.stringify({ error: 'invalid_period', message: `period must be one of ${allowed.join(', ')}` }), { status: 400, headers: { 'Content-Type': 'application/json' } });
  }
  const res = await getForecastData(region, period);
  return okJson({ message: { role: 'assistant', content: res.summary, chart: { stages: res.stages }, risks: [] } });
}


