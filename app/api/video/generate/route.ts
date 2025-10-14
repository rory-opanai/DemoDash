import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const { prompt, seconds = 12, size = '1280x720', versions = 1 } = await req.json();
  const n = Math.min(Math.max(parseInt(versions, 10) || 1, 1), 4);
  const jobIds = Array.from({ length: n }).map(() => `job_${Math.random().toString(36).slice(2,10)}`);
  return okJson({ jobIds, status: 'queued' });
}


