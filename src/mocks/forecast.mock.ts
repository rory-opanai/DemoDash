import { sleep } from "@/lib/utils";

export interface StageDatum { name: string; value: number }

export async function getForecastData(region: string, timeframe: 'weekly'|'monthly'|'quarterly') {
  await sleep(900);
  const base = 1000 + Math.round(Math.random() * 2000);
  const stages: StageDatum[] = [
    { name: 'Leads', value: base },
    { name: 'Qualified', value: base * 0.6 },
    { name: 'Proposal', value: base * 0.35 },
    { name: 'Negotiation', value: base * 0.2 },
    { name: 'Closed Won', value: base * 0.12 }
  ];
  return { stages, summary: `Forecast for ${region} (${timeframe}) suggests steady conversion with ${Math.round(stages[4].value)} wins.` };
}


