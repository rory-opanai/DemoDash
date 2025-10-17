"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type StepState = {
  input: string;
  output?: string;
  data?: Record<string, unknown>;
  completed: boolean;
};

type StoryModeState = {
  started: boolean;
  currentStepIndex: number;
  steps: Record<string, StepState>;
  markStarted: () => void;
  setCurrentStepIndex: (index: number) => void;
  setStepInput: (stepId: string, input: string) => void;
  completeStep: (stepId: string, payload: { output?: string; data?: Record<string, unknown> }) => void;
  resetStep: (stepId: string) => void;
  reset: () => void;
};

const storage = typeof window !== "undefined" ? createJSONStorage(() => sessionStorage) : undefined;

export const useStoryModeStore = create<StoryModeState>()(
  persist(
    (set) => ({
      started: false,
      currentStepIndex: 0,
      steps: {},
      markStarted: () =>
        set((state) => ({
          started: true,
          currentStepIndex: state.currentStepIndex ?? 0
        })),
      setCurrentStepIndex: (index) => set({ currentStepIndex: index }),
      setStepInput: (stepId, input) =>
        set((state) => ({
          steps: {
            ...state.steps,
            [stepId]: {
              input,
              completed: state.steps[stepId]?.completed ?? false,
              output: state.steps[stepId]?.output,
              data: state.steps[stepId]?.data
            }
          }
        })),
      completeStep: (stepId, payload) =>
        set((state) => ({
          steps: {
            ...state.steps,
            [stepId]: {
              input: state.steps[stepId]?.input ?? "",
              completed: true,
              output: payload.output ?? state.steps[stepId]?.output,
              data: {
                ...state.steps[stepId]?.data,
                ...payload.data
              }
            }
          }
        })),
      resetStep: (stepId) =>
        set((state) => {
          const next = { ...state.steps };
          delete next[stepId];
          return { steps: next };
        }),
      reset: () => ({
        started: false,
        currentStepIndex: 0,
        steps: {}
      })
    }),
    {
      name: "story-mode",
      storage
    }
  )
);

export const storyStepSelectors = {
  step: (stepId: string) => (state: StoryModeState) => state.steps[stepId],
  isCompleted: (stepId: string) => (state: StoryModeState) => state.steps[stepId]?.completed ?? false
};

export type { StepState };
