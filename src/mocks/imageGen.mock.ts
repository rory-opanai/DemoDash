import { sleep } from "@/lib/utils";

export async function generatePlaceholderImage(prompt: string, opts?: { size?: string; seed?: number }) {
  await sleep(1200);
  return {
    url: "/placeholders/image-1.svg",
    meta: { prompt, ...opts }
  };
}


