import { NextRequest } from 'next/server';
import { byokGuard, okJson, notImplemented } from '@/lib/api';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  // Phase-1: unavailable
  return notImplemented('Realtime token issuance is not available in Phase 1.');
}


