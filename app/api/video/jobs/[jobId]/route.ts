import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const err = byokGuard(req);
  if (err) return err;
  // Mock: instantly complete with poster
  return okJson({ id: params.jobId, status: 'completed', posterUrl: '/placeholders/video-poster.svg', durationSec: 12 });
}


