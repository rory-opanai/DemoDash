"use client";
import Link from "next/link";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";

interface FeatureTileProps {
  href?: string;
  title: string;
  description: string;
  icon: ReactNode;
  disabled?: boolean;
  tooltip?: string;
}

export function FeatureTile({ href = '#', title, description, icon, disabled, tooltip }: FeatureTileProps) {
  const body = (
    <div
      className={cn(
        "group relative rounded-2xl transition focus-visible:ring-2 focus-visible:ring-black/80",
        disabled ? "opacity-50 select-none pointer-events-none" : "hover:bg-neutral-50",
        "p-5 md:p-6"
      )}
      aria-disabled={disabled}
    >
      <div className="flex items-start">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 mr-4">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold text-neutral-900">{title}</div>
          <div className="mt-1 text-[13px] leading-5 text-neutral-600">{description}</div>
        </div>
      </div>
    </div>
  );
  const tile = disabled ? (
    tooltip ? <Tooltip content={tooltip}><div>{body}</div></Tooltip> : <div>{body}</div>
  ) : (
    <Link href={href} className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-black/80">{body}</Link>
  );
  return tile;
}


