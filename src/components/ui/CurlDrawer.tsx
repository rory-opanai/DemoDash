"use client";
import { useAppStore } from "@/stores/appStore";
import { X } from "lucide-react";

export function CurlDrawer({ curl }: { curl: string }) {
  const show = useAppStore((s) => s.showCurl);
  const setShow = useAppStore((s) => s.setShowCurl);
  if (!show) return null;
  return (
    <div className="fixed left-0 right-0 bottom-0 z-40 border-t border-neutral-200 bg-white shadow-[0_-8px_24px_rgba(0,0,0,0.06)]">
      <div className="container py-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[14px] font-medium text-neutral-900">CURL (placeholder)</div>
          <button aria-label="Close" onClick={() => setShow(false)} className="h-8 w-8 inline-flex items-center justify-center rounded-full hover:bg-neutral-100 focus-visible:ring-2 focus-visible:ring-black/80"><X className="h-4 w-4" /></button>
        </div>
        <pre className="whitespace-pre-wrap rounded-xl bg-neutral-50 p-3 text-[12px] leading-5 text-neutral-800 overflow-x-auto">{curl}</pre>
      </div>
    </div>
  );
}

