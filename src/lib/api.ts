import { NextRequest, NextResponse } from 'next/server';

export function requireByok(req: NextRequest): string | null {
  const key = req.headers.get('x-openai-key');
  if (!key) return null;
  return key;
}

export function byokGuard(req: NextRequest) {
  const key = requireByok(req);
  if (!key) {
    return NextResponse.json({ error: 'Missing X-OPENAI-KEY header' }, { status: 401 });
  }
  return null;
}

export async function readJson<T>(req: NextRequest): Promise<T> {
  const data = await req.json();
  return data as T;
}

export function okJson(data: any, init?: number | ResponseInit) {
  if (typeof init === 'number') {
    return NextResponse.json(data, { status: init });
  }
  return NextResponse.json(data, init);
}

export function notImplemented(hint: string) {
  return NextResponse.json({ error: 'Not implemented', hint }, { status: 501 });
}


