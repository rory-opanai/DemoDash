import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-openai-key');
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing X-OPENAI-KEY header' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }
  const { messages, tone = 'friendly', escalate = false, model = 'gpt-4.1-mini' } = await req.json();
  const upstream = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      stream: true,
      input: [
        {
          role: 'system',
          content: `You are a ${tone} support agent. ${escalate ? 'Escalate gracefully to a human when appropriate.' : 'Resolve the issue without escalation unless absolutely necessary.'}`
        },
        ...(messages || [])
      ]
    })
  });

  if (!upstream.ok || !upstream.body) {
    const errorText = await upstream.text();
    return new Response(errorText, { status: upstream.status || 500, headers: { 'Content-Type': 'application/json' } });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader();
      let buffer = '';
      const send = (payload: unknown) => controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() || '';
          for (const evt of events) {
            const line = evt.trim();
            if (!line.startsWith('data:')) continue;
            const json = line.slice(5).trim();
            if (json === '[DONE]') continue;
            try {
              const data = JSON.parse(json);
              if (data.type === 'response.output_text.delta' && data.delta) {
                send({ delta: data.delta });
              }
              if (data.type === 'response.completed') {
                send({ done: true });
              }
            } catch (err) {
              send({ error: 'stream_parse_error', detail: json });
            }
          }
        }
        if (buffer) {
          buffer.split('\n\n').forEach((evt) => {
            const line = evt.trim();
            if (line.startsWith('data:')) {
              const json = line.slice(5).trim();
              if (json === '[DONE]') return;
              try {
                const data = JSON.parse(json);
                if (data.type === 'response.output_text.delta' && data.delta) {
                  send({ delta: data.delta });
                }
              } catch (err) {
                send({ error: 'stream_parse_error', detail: json });
              }
            }
          });
        }
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}


