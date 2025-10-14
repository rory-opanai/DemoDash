"use client";
import { useEffect, useRef } from "react";
import { cn, formatDateTime } from "@/lib/utils";

export type ChatRole = "user" | "assistant" | "system";
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt?: string;
  citations?: { fileId: string; title?: string; chunk?: string; page?: number }[];
  attachments?: { name: string; size: number; fileId?: string }[];
  json?: unknown; // for structured output
  chart?: { stages: { name: string; value: number }[] };
}

export function ChatPane({ messages, isStreaming }: { messages: ChatMessage[]; isStreaming?: boolean }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isStreaming]);

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4 md:p-5 h-[calc(100vh-12rem)] lg:sticky lg:top-24 overflow-auto">
      <div className="space-y-4" ref={scroller}>
        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}> 
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-3", m.role === "user" ? "bg-black text-white" : "bg-neutral-100 text-neutral-900")}> 
              <div className="whitespace-pre-wrap text-[14px] leading-6">{m.content}</div>
              {m.attachments?.length ? (
                <div className="mt-2 text-[12px] text-neutral-600">
                  Attachments: {m.attachments.map((a) => a.name).join(", ")}
                </div>
              ) : null}
              {m.citations?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {m.citations.map((c, i) => (
                    <span key={i} className="rounded-full bg-neutral-200 px-2 py-0.5 text-[12px]">{c.title || c.fileId}{c.page ? ` · p${c.page}` : ""}</span>
                  ))}
                </div>
              ) : null}
              {m.json ? (
                <details className="mt-2">
                  <summary className="cursor-pointer text-[13px]">View JSON</summary>
                  <pre className="mt-2 rounded-xl bg-white border border-neutral-200 p-3 text-[12px] overflow-x-auto">{JSON.stringify(m.json, null, 2)}</pre>
                </details>
              ) : null}
              {m.chart ? (
                <div className="mt-3 rounded-xl border border-neutral-200 p-3 text-[12px]">Chart data attached ({m.chart.stages.length} stages)</div>
              ) : null}
              <div className="mt-1 text-[11px] opacity-60">{m.createdAt ? formatDateTime(m.createdAt) : ""}</div>
            </div>
          </div>
        ))}
        {isStreaming ? <div className="text-[13px] text-neutral-500">Assistant is typing…</div> : null}
      </div>
    </div>
  );
}


