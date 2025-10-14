"use client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface HeroCardProps {
  title: string;
  subtitle: string;
  gradientClass: string;
  tryHref: string;
}

export function HeroCard({ title, subtitle, gradientClass, tryHref }: HeroCardProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn("h-56 p-6 flex flex-col justify-between overflow-hidden rounded-2xl shadow-[0_1px_2px_rgba(0,0,0,0.04),_0_8px_24px_rgba(0,0,0,0.06)]", gradientClass)}>
      <div>
        <h3 className="text-2xl font-semibold text-neutral-900">{title}</h3>
        <p className="text-sm text-neutral-600 mt-1">{subtitle}</p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => setOpen(true)} variant="secondary">Play intro</Button>
        <a href={tryHref}>
          <Button>Try it live</Button>
        </a>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader title={`${title} — Intro`} description="A quick overview (placeholder)." />
          <div className="aspect-video w-full rounded-xl overflow-hidden flex items-center justify-center text-sm text-neutral-600 bg-neutral-100">
            <div className="text-center">
              <div className="text-4xl mb-2">▶</div>
              <p>Inline illustration in place of a video for Phase 1.</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <a href={tryHref}><Button>Try it live</Button></a>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}


