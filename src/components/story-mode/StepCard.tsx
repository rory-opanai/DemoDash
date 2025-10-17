"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StepCard({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-neutral-200 bg-white/70 shadow-sm backdrop-blur-sm", className)}>
      <div className="border-b border-neutral-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
        {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
      </div>
      <div className="px-6 py-6">{children}</div>
    </div>
  );
}
