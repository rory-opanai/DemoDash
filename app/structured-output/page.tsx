"use client";
import { useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [schema, setSchema] = useState<'contractSummary'|'salesForecast'|'piiExtract'>('contractSummary');
  const [useTools, setUseTools] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.byokToken);

  async function run() {
    if (!prompt.trim()) return;
    if (!token) {
      setError('Add your OpenAI API key in Settings before running structured output.');
      return;
    }
    const me: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, me]);
    setPrompt('');
    setIsRunning(true);
    try {
      const res = await fetch('/api/structured/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token }, body: JSON.stringify({ sessionId: 's1', messages: [{ role:'user', content: me.content }], schemaId: schema, useTools }) });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Structured output failed.');
      }
      const data = await res.json();
      const ai: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.message.content, json: data.message.json, createdAt: new Date().toISOString() };
      setMessages((m) => [...m, ai]);
      setError(null);
    } catch (err) {
      console.error('Structured output failed', err);
      const message = err instanceof Error ? err.message : 'Structured output failed.';
      setError(message);
      const ai: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: `⚠️ ${message}`, createdAt: new Date().toISOString() };
      setMessages((m) => [...m, ai]);
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <ChatFeaturePage
      title="Structured Output / Function Calling"
      subtitle="Constrain responses to JSON schemas with optional tool calling."
      messages={messages}
      right={
        <RightPane>
          <div className="space-y-4">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Schema</div>
              <Select value={schema} onChange={(e) => setSchema(e.target.value as any)}>
                <option value="contractSummary">contractSummary</option>
                <option value="salesForecast">salesForecast</option>
                <option value="piiExtract">piiExtract</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input id="tool" type="checkbox" className="h-4 w-4" checked={useTools} onChange={(e) => setUseTools(e.target.checked)} />
              <label htmlFor="tool" className="text-[13px]">Enable tool calling</label>
            </div>
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Prompt</div>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Describe what JSON you need…" rows={5} />
              <div className="mt-3 flex justify-end"><Button onClick={run} disabled={!prompt.trim() || isRunning}>{isRunning ? 'Running…' : 'Run'}</Button></div>
            </div>
          </div>
        </RightPane>
      }
    />
  );
}


