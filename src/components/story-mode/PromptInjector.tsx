"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function PromptInjector({
  label,
  description,
  value,
  onUse
}: {
  label: string;
  description?: string;
  value: ReactNode;
  onUse?: () => void;
}) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-neutral-800">{label}</div>
          {description ? <p className="mt-1 text-xs text-neutral-600">{description}</p> : null}
          <div className="mt-3 text-sm text-neutral-700">{value}</div>
        </div>
        {onUse ? (
          <Button size="sm" variant="secondary" onClick={onUse}>
            Use in prompt
          </Button>
        ) : null}
      </div>
    </div>
  );
}
