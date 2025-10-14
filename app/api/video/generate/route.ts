"use server";
import { NextRequest } from 'next/server';
import { byokGuard } from '@/lib/api';

export async function POST(req: NextRequest) {
  const guard = byokGuard(req);
  if (guard) return guard;
  return new Response(
    JSON.stringify({
      error: 'sora_unavailable',
      message: 'Video generation is available via the public Sora showcase.',
      url: 'https://openai-sora-demo.vercel.app'
    }),
    { status: 501, headers: { 'Content-Type': 'application/json' } }
  );
}


