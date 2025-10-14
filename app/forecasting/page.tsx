"use client";

export default function Page() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 space-y-4">
      <span className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">Coming Soon</span>
      <h1 className="text-2xl font-semibold text-neutral-900">Sales Forecasting Agent</h1>
      <p className="text-sm text-neutral-600">Forecasts will integrate with Salesforce via the Model Context Protocol (MCP) connector to pull live pipeline data and summarise it with OpenAI. This feature is currently under development.</p>
    </div>
  );
}


