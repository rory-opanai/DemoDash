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
  const token = useAuthStore((s) => s.byokToken);

  async function send() {
    const me: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, me]);
    setPrompt('');
    const res = await fetch('/api/support/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token || '' }, body: JSON.stringify({ sessionId: 's1', messages: [{ role:'user', content: me.content }], tone, escalate }) });
    if (!res.ok || !res.body) return;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let content = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      chunk.split("\n\n").forEach((l) => {
        if (l.startsWith('data: ')) {
          try { const j = JSON.parse(l.slice(6)); content += j.delta || ''; } catch {}
        }
      });
    }
    const ai: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, ai]);
  }

  return (
    <ChatFeaturePage
      title="Customer Support Bot"
      subtitle="Tone presets and escalation toggle."
      messages={messages}
      right={
        <RightPane>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className="text-[13px] text-neutral-700">Tone</span><Select value={tone} onChange={(e) => setTone(e.target.value as any)}><option value="friendly">friendly</option><option value="professional">professional</option><option value="terse">terse</option></Select></div>
              <div className="flex items-center gap-2"><span className="text-[13px] text-neutral-700">Escalation</span><Switch checked={escalate} onChange={(e: any) => setEscalate(e.target.checked)} /></div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Prompt</div>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Type a support message…" />
              <div className="mt-3 flex justify-end"><Button onClick={send}>Send</Button></div>
            </div>
          </div>
        </RightPane>
      }
    />
  );
}


