"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore } from "@/stores/authStore";
import { storyStepSelectors, useStoryModeStore } from "@/stores/storyModeStore";
import { PromptInjector } from "./PromptInjector";

export function StoryRealtimeRecorder({
  stepId,
  initialPrompt,
  dependsOn
}: {
  stepId: string;
  initialPrompt: string;
  dependsOn?: string[];
}) {
  const token = useAuthStore((s) => s.byokToken);
  const stepState = useStoryModeStore(storyStepSelectors.step(stepId));
  const setStepInput = useStoryModeStore((s) => s.setStepInput);
  const completeStep = useStoryModeStore((s) => s.completeStep);
  const dependencyData = useStoryModeStore((state) =>
    (dependsOn || []).map((dep) => ({ id: dep, state: state.steps[dep] }))
  );
  const script = stepState?.input ?? initialPrompt;

  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | undefined>(() =>
    typeof stepState?.data?.audioUrl === "string" ? (stepState.data.audioUrl as string) : undefined
  );

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    if (!stepState) {
      setStepInput(stepId, initialPrompt);
    }
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, [initialPrompt, setStepInput, stepId, stepState]);

  const knowledge = useMemo(() => dependencyData.find((d) => d.id === "knowledge-assistant"), [dependencyData]);
  const knowledgeAnswer = knowledge?.state?.output;

  const transcribe = useCallback(
    async (blob: Blob) => {
      if (!token) {
        setError("Add your OpenAI API key in Settings before recording audio.");
        return;
      }
      setIsProcessing(true);
      setError(null);
      try {
        const fd = new FormData();
        fd.append("audio", blob, "story-voiceover.webm");
        const res = await fetch("/api/realtime/transcribe", {
          method: "POST",
          headers: { "X-OPENAI-KEY": token },
          body: fd
        });
        if (!res.ok) {
          const message = await res.text();
          throw new Error(message || "Transcription failed.");
        }
        const data = await res.json();
        const transcript = data.text || "";
        const localUrl = URL.createObjectURL(blob);
        setAudioUrl(localUrl);
        completeStep(stepId, {
          output: transcript,
          data: {
            transcript,
            audioUrl: localUrl,
            script
          }
        });
      } catch (err) {
        console.error("Story realtime transcription failed", err);
        const message = err instanceof Error ? err.message : "Transcription failed.";
        setError(message);
      } finally {
        setIsProcessing(false);
      }
    },
    [completeStep, script, stepId, token]
  );

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      audioChunks.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunks.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: "audio/webm" });
        recorder.stream.getTracks().forEach((track) => track.stop());
        transcribe(blob);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setError(null);
    } catch (err) {
      console.error("Story realtime recording failed", err);
      setError("Could not access microphone.");
    }
  }, [isRecording, transcribe]);

  return (
    <div className="space-y-6">
      {knowledgeAnswer ? (
        <PromptInjector
          label="Knowledge answer ready"
          description="Use the assistant&apos;s response as inspiration for your voiceover script."
          value={<p className="text-sm text-neutral-700">{knowledgeAnswer}</p>}
          onUse={() => setStepInput(stepId, `${script}\n\nReference talking points: ${knowledgeAnswer}`)}
        />
      ) : null}
      <div>
        <div className="text-sm font-medium text-neutral-800">Voiceover Script</div>
        <Textarea
          value={script}
          rows={5}
          onChange={(e) => setStepInput(stepId, e.target.value)}
          placeholder="Outline what you want to say before recording…"
        />
      </div>
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-800">Record voiceover</div>
            <p className="text-xs text-neutral-600">Explain how NovaMind processes PII in your own words.</p>
          </div>
          <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? "destructive" : "default"}>
            {isRecording ? "Stop recording" : "Start recording"}
          </Button>
        </div>
        {isProcessing ? <p className="mt-3 text-sm text-neutral-600">Processing audio…</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        {audioUrl ? (
          <div className="mt-4 space-y-2">
            <audio controls src={audioUrl} className="w-full" />
            {stepState?.output ? (
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">Transcript: {stepState.output}</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
