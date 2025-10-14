import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const key = req.headers.get('x-openai-key');
  if (!key) return new Response(JSON.stringify({ error: 'Missing X-OPENAI-KEY header' }), { status: 401 });
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(data: string) {
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      }
      send(JSON.stringify({ delta: 'Thanks for reaching out. ' }));
      await new Promise(r => setTimeout(r, 300));
      send(JSON.stringify({ delta: 'This is a mocked streaming reply. ' }));
      await new Promise(r => setTimeout(r, 300));
      send(JSON.stringify({ delta: 'How can I help further?' }));
      await new Promise(r => setTimeout(r, 100));
      controller.close();
    }
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' } });
}


