"use client";
import { useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [period, setPeriod] = useState<'weekly'|'monthly'|'quarterly'>('monthly');
  const [region, setRegion] = useState('Global');
  const token = useAuthStore((s) => s.byokToken);

  async function run() {
    const res = await fetch('/api/forecast/run', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token || '' }, body: JSON.stringify({ sessionId: 's1', period, region, useMock: true }) });
    const data = await res.json();
    const ai: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: data.message.content, chart: data.message.chart, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, ai]);
  }

  return (
    <ChatFeaturePage
      title="Sales Forecasting Agent"
      subtitle="Run snapshots; results appear as messages with inline chart metadata."
      messages={messages}
      right={
        <RightPane>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2"><span className="text-[13px] text-neutral-700">Period</span><Select value={period} onChange={(e) => setPeriod(e.target.value as any)}><option value="weekly">weekly</option><option value="monthly">monthly</option><option value="quarterly">quarterly</option></Select></div>
              <div className="flex items-center gap-2"><span className="text-[13px] text-neutral-700">Region</span><Select value={region} onChange={(e) => setRegion(e.target.value)}><option>Global</option><option>North America</option><option>EMEA</option><option>APAC</option></Select></div>
            </div>
            <div className="flex justify-end"><Button onClick={run}>Run snapshot</Button></div>
          </div>
        </RightPane>
      }
    />
  );
}


