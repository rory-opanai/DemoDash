"use server";
import { NextRequest } from 'next/server';
import { byokGuard } from '@/lib/api';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  return new Response(
    JSON.stringify({
      error: 'forecast_connector_missing',
      message: 'Salesforce forecasting via MCP is coming soon.'
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}


