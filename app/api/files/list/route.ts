import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function GET(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  // Phase-1: no persistence; return empty list
  return okJson({ items: [] });
}


