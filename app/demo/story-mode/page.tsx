"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepCard } from "@/components/story-mode/StepCard";
import { StepNavigation } from "@/components/story-mode/StepNavigation";
import { demoSteps } from "@/story-mode-config";
import { storyStepSelectors, useStoryModeStore } from "@/stores/storyModeStore";

export default function StoryModePage() {
  const router = useRouter();
  const started = useStoryModeStore((state) => state.started);
  const markStarted = useStoryModeStore((state) => state.markStarted);
  const reset = useStoryModeStore((state) => state.reset);
  const stepsState = useStoryModeStore((state) => state.steps);
  const currentStepIndex = useStoryModeStore((state) => state.currentStepIndex);
  const setCurrentStepIndex = useStoryModeStore((state) => state.setCurrentStepIndex);

  const activeStep = demoSteps[currentStepIndex];
  const stepCount = demoSteps.length;
  const hasSession = Object.keys(stepsState).length > 0;

  const isStepCompleted = useStoryModeStore(
    activeStep ? storyStepSelectors.isCompleted(activeStep.id) : () => false
  );

  const beginDemo = () => {
    reset();
    markStarted();
    setCurrentStepIndex(0);
  };

  const resumeDemo = () => {
    markStarted();
    setCurrentStepIndex(Math.min(currentStepIndex, stepCount - 1));
  };

  const goNext = () => {
    if (!activeStep) return;
    if (currentStepIndex >= stepCount - 1) {
      router.push("/");
      return;
    }
    setCurrentStepIndex(currentStepIndex + 1);
  };

  const goBack = () => {
    if (currentStepIndex === 0) return;
    setCurrentStepIndex(currentStepIndex - 1);
  };

  const stepper = useMemo(() => {
    return (
      <div className="flex flex-wrap items-center gap-2">
        {demoSteps.map((step, index) => {
          const completed = Boolean(stepsState[step.id]?.completed);
          const isActive = index === currentStepIndex;
          const isClickable = index < currentStepIndex || completed;
          return (
            <Button
              key={step.id}
              size="sm"
              variant={isActive ? "default" : completed ? "secondary" : "outline"}
              onClick={() => (isClickable ? setCurrentStepIndex(index) : null)}
              disabled={!isClickable}
            >
              {index + 1}. {step.title.replace(/Step \d+ — /, "")}
            </Button>
          );
        })}
      </div>
    );
  }, [currentStepIndex, setCurrentStepIndex, stepsState]);

  if (!started || !activeStep) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6 py-12">
        <Link href="/" className="flex items-center gap-2 text-sm text-neutral-600">
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <StepCard
          title="Story Mode"
          description="Deliver a cohesive NovaMind narrative across image generation, structured policies, knowledge retrieval, realtime voice, and support chat."
        >
          <div className="grid gap-4 text-sm text-neutral-700">
            <p>
              Story Mode stitches together the most impactful DemoDash modules into a guided flow designed for
              Solutions Engineers and Account Directors. Use it to showcase how NovaMind handles customer PII from brand to support.
            </p>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <h2 className="text-sm font-semibold text-neutral-800">What you&apos;ll cover</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {demoSteps.map((step) => (
                  <li key={step.id}>{step.title.replace(/Step \d+ — /, "")}</li>
                ))}
              </ul>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={beginDemo}>Begin demo</Button>
              {hasSession ? (
                <Button variant="secondary" onClick={resumeDemo}>
                  Resume last session
                </Button>
              ) : null}
            </div>
          </div>
        </StepCard>
      </div>
    );
  }

  const isFinalStep = currentStepIndex === stepCount - 1;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 py-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Story Mode</div>
          <h1 className="text-2xl font-semibold text-neutral-900">{activeStep.title}</h1>
          <p className="mt-1 text-sm text-neutral-600">{activeStep.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-500">
            Step {currentStepIndex + 1} of {stepCount}
          </span>
          <Button variant="outline" onClick={() => router.push("/")}>
            <Home className="mr-2 h-4 w-4" /> Exit
          </Button>
        </div>
      </div>
      {stepper}
      <StepCard title={activeStep.title} description={activeStep.description}>
        <div className="space-y-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-sm font-medium text-neutral-800">Guided prompt</div>
            <p className="mt-2 text-sm text-neutral-600">{activeStep.initialPrompt || "Use the module below to continue the story."}</p>
          </div>
          <div>{activeStep.featureComponent}</div>
        </div>
      </StepCard>
      <StepNavigation
        onBack={goBack}
        onNext={goNext}
        canGoBack={currentStepIndex > 0}
        canGoNext={isFinalStep ? true : Boolean(isStepCompleted)}
        nextLabel={isFinalStep ? "Finish demo" : "Next"}
      />
    </div>
  );
}
