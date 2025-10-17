"use server";
import { NextRequest } from 'next/server';
import { okJson } from '@/lib/api';

export async function GET(_req: NextRequest) {
  return okJson({ status: 'ok', timestamp: new Date().toISOString() });
}
