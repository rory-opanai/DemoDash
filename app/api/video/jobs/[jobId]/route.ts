import { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { byokGuard, okJson } from '@/lib/api';

export async function GET(req: NextRequest, { params }: { params: { jobId: string } }) {
  const err = byokGuard(req);
  if (err) return err;
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'missing_api_key', message: 'Provide X-OPENAI-KEY header.' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }

  const client = new OpenAI({ apiKey });
  try {
    const job = await client.videos.retrieve(params.jobId);
    return okJson({
      id: job.id,
      status: job.status,
      progress: job.progress,
      model: job.model,
      seconds: job.seconds,
      size: job.size,
      error: job.error,
      posterUrl: job.status === 'completed' ? `/api/video/jobs/${params.jobId}/content?variant=thumbnail` : null,
      videoUrl: job.status === 'completed' ? `/api/video/jobs/${params.jobId}/content?variant=video` : null
    });
  } catch (error: unknown) {
    console.error('Failed to retrieve video job', error);
    const message = error instanceof Error ? error.message : 'Unable to retrieve video job.';
    const status = (error as any)?.status ?? 500;
    return new Response(JSON.stringify({ error: 'video_job_lookup_failed', message }), { status, headers: { 'Content-Type': 'application/json' } });
  }
}


