import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const { query, topK = 5 } = await req.json();
  const k = Math.min(10, Math.max(1, topK));
  const results = Array.from({ length: k }).map((_, i) => ({ id: `r_${i}`, score: Math.round((0.92 - i*0.07)*100)/100, text: `Result ${i+1} for "${query}"` }));
  return okJson({ results });
}


