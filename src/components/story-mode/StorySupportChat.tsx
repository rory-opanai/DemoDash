"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useAuthStore } from "@/stores/authStore";
import { storyStepSelectors, useStoryModeStore } from "@/stores/storyModeStore";
import { PromptInjector } from "./PromptInjector";

type ConversationMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export function StorySupportChat({
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
  const prompt = stepState?.input ?? initialPrompt;

  const [tone, setTone] = useState("friendly");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationMessage[]>(() => {
    const existing = stepState?.data?.conversation as ConversationMessage[] | undefined;
    return existing ?? [];
  });

  const voiceover = useMemo(() => dependencyData.find((d) => d.id === "realtime-assistant"), [dependencyData]);
  const transcript = voiceover?.state?.output;

  useEffect(() => {
    if (!stepState) {
      setStepInput(stepId, initialPrompt);
    }
  }, [initialPrompt, setStepInput, stepId, stepState]);

  useEffect(() => {
    if (stepState?.data?.conversation) {
      setConversation(stepState.data.conversation as ConversationMessage[]);
    }
  }, [stepState?.data?.conversation]);

  async function send() {
    if (!prompt.trim()) return;
    if (!token) {
      setError("Add your OpenAI API key in Settings before using support chat.");
      return;
    }
    const user: ConversationMessage = { id: crypto.randomUUID(), role: "user", content: prompt };
    const placeholder: ConversationMessage = { id: crypto.randomUUID(), role: "assistant", content: "" };
    const nextHistory = [...conversation, user, placeholder];
    setConversation(nextHistory);
    setStepInput(stepId, "");
    setIsStreaming(true);
    setError(null);
    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-OPENAI-KEY": token
        },
        body: JSON.stringify({
          sessionId: "story-support",
          tone,
          escalate: false,
          messages: nextHistory.slice(0, -1).map(({ role, content }) => ({ role, content }))
        })
      });
      if (!res.ok || !res.body) {
        const message = await res.text();
        throw new Error(message || "Support bot failed.");
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        chunk.split("\n\n").forEach((line) => {
          if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.delta) {
                content += payload.delta;
                setConversation((prev) =>
                  prev.map((msg) => (msg.id === placeholder.id ? { ...msg, content } : msg))
                );
              }
            } catch (err) {
              console.warn("Story support streaming parse error", err);
            }
          }
        });
      }
      const finalized = nextHistory.map((msg) => (msg.id === placeholder.id ? { ...msg, content } : msg));
      setConversation(finalized);
      completeStep(stepId, {
        output: content,
        data: {
          conversation: finalized,
          tone,
          transcript
        }
      });
    } catch (err) {
      console.error("Story support bot failed", err);
      const message = err instanceof Error ? err.message : "Support bot failed.";
      setError(message);
      setConversation((prev) =>
        prev.map((msg) =>
          msg.role === "assistant" && !msg.content
            ? { ...msg, content: `⚠️ ${message}` }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <div className="space-y-6">
      {transcript ? (
        <PromptInjector
          label="Voiceover transcript"
          description="Keep the story consistent by reusing your recorded talking points."
          value={<p className="text-sm text-neutral-700 whitespace-pre-wrap">{transcript}</p>}
          onUse={() => setStepInput(stepId, `${prompt}\n\nAs noted in the voiceover: ${transcript}`)}
        />
      ) : null}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-neutral-800">Support conversation</div>
            <p className="text-xs text-neutral-600">Simulate how NovaMind responds to privacy questions.</p>
          </div>
          <Select value={tone} onChange={(event) => setTone(event.target.value)}>
            <option value="friendly">friendly tone</option>
            <option value="professional">professional tone</option>
            <option value="terse">terse tone</option>
          </Select>
        </div>
        <div className="mt-4 space-y-3 max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
          {conversation.length === 0 ? (
            <p className="text-neutral-500">No messages yet. Send the scripted customer question to begin.</p>
          ) : (
            conversation.map((msg) => (
              <div key={msg.id} className="space-y-1">
                <span className="text-xs font-semibold text-neutral-500 uppercase">{msg.role}</span>
                <p className="whitespace-pre-wrap text-neutral-800">{msg.content}</p>
              </div>
            ))
          )}
        </div>
      </div>
      <div>
        <div className="text-sm font-medium text-neutral-800">Customer message</div>
        <Textarea
          value={prompt}
          rows={4}
          onChange={(event) => setStepInput(stepId, event.target.value)}
          placeholder="Type or adapt the scripted customer question…"
        />
        <div className="mt-3 flex justify-end">
          <Button onClick={send} disabled={!prompt.trim() || isStreaming}>
            {isStreaming ? "Responding…" : "Send"}
          </Button>
        </div>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
  );
}
