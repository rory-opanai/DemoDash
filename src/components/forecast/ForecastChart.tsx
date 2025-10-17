"use client";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

export interface ForecastPoint {
  period: string;
  pipeline?: number;
  forecast: number;
}

function formatCurrency(value: number | string | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) return value ?? '';
  return `$${value.toLocaleString()}`;
}

export function ForecastChart({ data }: { data: ForecastPoint[] }) {
  if (!data.length) {
    return <div className="text-sm text-neutral-500">No chart data available.</div>;
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="period" tick={{ fontSize: 12 }} />
          <YAxis
            tickFormatter={(value) =>
              typeof value === 'number' ? `$${Math.round(value / 1000).toLocaleString()}k` : String(value)
            }
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number | string, name: string) => [
              typeof value === 'number' ? formatCurrency(Math.round(value)) : value,
              name
            ]}
            labelFormatter={(label) => `Period: ${label}`}
          />
          <Legend verticalAlign="top" height={36} />
          <Line type="monotone" dataKey="pipeline" stroke="#8884d8" strokeWidth={2} dot={{ r: 3 }} name="Pipeline" />
          <Line type="monotone" dataKey="forecast" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} name="Forecast" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

