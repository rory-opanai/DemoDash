"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function Switch({ className, ...props }: SwitchProps) {
  return (
    <label className={cn("relative inline-flex cursor-pointer items-center", className)}>
      <input type="checkbox" className="sr-only peer" {...props} />
      <div className="h-6 w-10 rounded-full bg-neutral-200 peer-focus:ring-2 peer-focus:ring-black/80 peer-checked:bg-black transition-colors" />
      <div className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
    </label>
  );
}


