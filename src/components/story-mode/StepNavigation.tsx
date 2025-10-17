"use client";

import { Button } from "@/components/ui/button";

export function StepNavigation({
  onBack,
  onNext,
  canGoBack,
  canGoNext,
  nextLabel = "Next",
  backLabel = "Back"
}: {
  onBack: () => void;
  onNext: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
  nextLabel?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={onBack} disabled={!canGoBack}>
        {backLabel}
      </Button>
      <Button onClick={onNext} disabled={!canGoNext}>
        {nextLabel}
      </Button>
    </div>
  );
}
