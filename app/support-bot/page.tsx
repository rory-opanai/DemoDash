"use client";
import { useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState<'friendly'|'professional'|'terse'>('friendly');
  const [escalate, setEscalate] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.byokToken);

  async function send() {
    if (!prompt.trim()) return;
    if (!token) {
      setError('Add your OpenAI API key in Settings before using the support bot.');
      return;
    }
    const me: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() };
    const assistantPlaceholder: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: '', createdAt: new Date().toISOString() };
    const history = [...messages, me, assistantPlaceholder];
    setMessages(history);
    setPrompt('');
    setIsStreaming(true);
    setError(null);
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token },
        body: JSON.stringify({ sessionId: 's1', messages: history.slice(0, -1).map(({ role, content }) => ({ role, content })), tone, escalate })
      });
      if (!res.ok || !res.body) {
        const message = await res.text();
        throw new Error(message || 'Streaming failed.');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        chunk.split("\n\n").forEach((l) => {
          if (l.startsWith('data: ')) {
            try {
              const j = JSON.parse(l.slice(6));
              if (j.delta) {
                content += j.delta;
                setMessages((prev) => prev.map((msg) => (msg.id === assistantPlaceholder.id ? { ...msg, content } : msg)));
              }
            } catch (err) {
              console.warn('Stream parse error', err);
            }
          }
        });
      }
      setMessages((prev) => prev.map((msg) => (msg.id === assistantPlaceholder.id ? { ...msg, content } : msg)));
    } catch (err) {
      console.error('Support bot error', err);
      const message = err instanceof Error ? err.message : 'Support bot failed.';
      setError(message);
      setMessages((prev) => prev.map((msg) => (msg.id === assistantPlaceholder.id ? { ...msg, content: `⚠️ ${message}` } : msg)));
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <ChatFeaturePage
      title="Customer Support Bot"
      subtitle="Tone presets and escalation toggle."
      messages={messages}
      right={
        <RightPane>
          <div className="space-y-4">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-[13px] text-neutral-600">
              Tip: ask about a billing issue or return request to see the assistant adapt tone and optionally escalate to a human agent.
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className="text-[13px] text-neutral-700">Tone</span><Select value={tone} onChange={(e) => setTone(e.target.value as any)}><option value="friendly">friendly</option><option value="professional">professional</option><option value="terse">terse</option></Select></div>
              <div className="flex items-center gap-2"><span className="text-[13px] text-neutral-700">Escalation</span><Switch checked={escalate} onChange={(e: any) => setEscalate(e.target.checked)} /></div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Prompt</div>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Type a support message…" rows={5} />
              <div className="mt-3 flex justify-end"><Button onClick={send} disabled={!prompt.trim() || isStreaming}>{isStreaming ? 'Responding…' : 'Send'}</Button></div>
            </div>
          </div>
        </RightPane>
      }
    />
  );
}


