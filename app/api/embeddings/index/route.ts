import { NextRequest } from 'next/server';
import { byokGuard, okJson } from '@/lib/api';

export async function POST(req: NextRequest) {
  const err = byokGuard(req);
  if (err) return err;
  const { docs } = await req.json();
  return okJson({ count: (docs?.length as number) || 0 });
}


