"use client";
import Link from "next/link";

export default function Page() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">Powered by Sora</div>
      <h1 className="text-2xl font-semibold text-neutral-900">Video Generation</h1>
      <p className="text-sm text-neutral-600">Sora previews are available on the official showcase. Explore high-fidelity video generations and sample prompts.</p>
      <Link href="https://openai-sora-demo.vercel.app" target="_blank" className="inline-flex h-10 items-center justify-center rounded-xl bg-black px-4 text-sm font-medium text-white hover:bg-black/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/80">Open Sora Demo</Link>
    </div>
  );
}


