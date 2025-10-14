import { sleep } from "@/lib/utils";

export async function generatePlaceholderVideo(prompt: string, opts?: { durationSec?: number }) {
  await sleep(1500);
  return {
    posterUrl: "/placeholders/video-poster.svg",
    durationSec: opts?.durationSec ?? 12,
    meta: { prompt }
  };
}


