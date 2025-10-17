"use client";
import { useMemo, useState } from 'react';
import { HistoryPanel } from '@/components/feature/HistoryPanel';
import { useAuthStore } from '@/stores/authStore';
import { useHistoryStore } from '@/stores/historyStore';
import { ForecastChart, type ForecastPoint } from '@/components/forecast/ForecastChart';
import { AnyHistoryItem } from '@/types/history';
import { id } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface ForecastResponse {
  summary: string;
  series: ForecastPoint[];
  recommendations?: string[];
  confidence?: string;
  horizon: string;
  model: string;
  generatedAt: string;
  totals?: { pipeline: number; forecast: number };
  error?: string;
  message?: string;
}

const HORIZON_OPTIONS = [
  { value: 'quarter', label: 'Next four quarters' },
  { value: 'month', label: 'Next six months' }
] as const;

type HorizonValue = (typeof HORIZON_OPTIONS)[number]['value'];

export default function Page() {
  const token = useAuthStore((s) => s.byokToken);
  const addHistory = useHistoryStore((s) => s.add);
  const [horizon, setHorizon] = useState<HorizonValue>('quarter');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectorUnavailable, setConnectorUnavailable] = useState(false);
  const [result, setResult] = useState<ForecastResponse | null>(null);

  const horizonLabel = useMemo(
    () => HORIZON_OPTIONS.find((h) => h.value === horizon)?.label ?? 'Upcoming periods',
    [horizon]
  );

  const handleRemix = (item: AnyHistoryItem) => {
    const nextHorizon = (item.meta?.['horizon'] as HorizonValue | undefined) ?? 'quarter';
    setHorizon(nextHorizon);
    setError(null);
    setConnectorUnavailable(false);
    setIsLoading(false);
    if (item.meta?.['summary']) {
      setResult({
        summary: String(item.meta['summary'] ?? ''),
        series: (item.meta['series'] as ForecastPoint[]) ?? [],
        recommendations: (item.meta['recommendations'] as string[]) || [],
        confidence: item.meta['confidence'] as string | undefined,
        horizon: nextHorizon,
        model: item.model || 'gpt-4.1-mini',
        generatedAt: item.createdAt,
        totals: item.meta['totals'] as { pipeline: number; forecast: number } | undefined
      });
    } else {
      setResult(null);
    }
  };

  async function runForecast() {
    if (!token) {
      setError('Add your OpenAI API key in Settings to run the forecast.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/forecast/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OPENAI-KEY': token
        },
        body: JSON.stringify({ horizon })
      });
      const data = (await res.json()) as ForecastResponse;
      if (!res.ok || data.error) {
        const message = data?.message || 'Forecasting failed.';
        setError(message);
        setResult(null);
        setConnectorUnavailable(data?.error === 'connector_unconfigured');
        return;
      }
      setConnectorUnavailable(false);
      setResult(data);
      const historyItem: AnyHistoryItem = {
        id: id('forecast'),
        kind: 'chart',
        title: `Forecast · ${horizon === 'month' ? 'Monthly' : 'Quarterly'}`,
        model: data.model,
        createdAt: data.generatedAt,
        status: 'ready',
        meta: {
          summary: data.summary,
          series: data.series,
          recommendations: data.recommendations,
          confidence: data.confidence,
          horizon,
          totals: data.totals
        }
      } as AnyHistoryItem;
      addHistory('forecasting', historyItem);
    } catch (err) {
      setError('Forecasting failed. Please try again.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-6">
      <HistoryPanel namespace="forecasting" onRemix={handleRemix} />
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Sales Forecasting Agent</h1>
            <p className="text-sm text-neutral-600">
              Generate weighted forecasts from Salesforce via Model Context Protocol connectors.
            </p>
          </div>
          {connectorUnavailable ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              Connector required
            </span>
          ) : null}
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 space-y-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Build forecast</h2>
              <p className="text-sm text-neutral-600">
                Choose a horizon and pull the latest weighted pipeline into OpenAI for a narrative plus chart.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={horizon} onChange={(e) => setHorizon(e.target.value as HorizonValue)}>
                {HORIZON_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              <Button onClick={runForecast} disabled={isLoading || connectorUnavailable}>
                {isLoading ? 'Fetching…' : 'Run forecast'}
              </Button>
            </div>
          </div>
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 text-sm text-neutral-600">
            The agent queries Salesforce through the MCP connector, computes weighted pipeline, then asks OpenAI to produce a chart-friendly forecast.
          </div>
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          ) : null}
          {result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-neutral-900">{horizonLabel}</h3>
                {result.confidence ? <Badge variant="outline">Confidence: {result.confidence}</Badge> : null}
                <span className="text-xs text-neutral-500">Generated {new Date(result.generatedAt).toLocaleString()}</span>
              </div>
              <ForecastChart data={result.series} />
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{result.summary}</p>
              {result.recommendations?.length ? (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-neutral-900">Next best actions</div>
                  <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
                    {result.recommendations.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {result.totals ? (
                <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700">
                  <div className="font-medium text-neutral-900 mb-2">Totals</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-neutral-500">Pipeline</div>
                      <div className="text-neutral-900 text-base font-semibold">${result.totals.pipeline.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-neutral-500">Forecast</div>
                      <div className="text-neutral-900 text-base font-semibold">${result.totals.forecast.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-neutral-500">Run the forecast to see pipeline-driven projections and a narrative summary.</div>
          )}
        </div>
      </div>
    </div>
  );
}
