"use client";
import { useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const [messages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'idle'|'connecting'|'unavailable'>('unavailable');
  const [model, setModel] = useState('gpt-5-realtime');
  const token = useAuthStore((s) => s.byokToken);

  async function connect() {
    const res = await fetch('/api/realtime/token', { method: 'POST', headers: { 'X-OPENAI-KEY': token || '' } });
    if (res.status === 501) setStatus('unavailable');
  }

  return (
    <ChatFeaturePage
      title="Realtime Voice + Multimodal"
      subtitle="WebRTC realtime access is coming soon."
      messages={messages}
      right={
        <RightPane>
          <div className="space-y-4">
            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">Coming Soon</span>
            <div className="flex items-center gap-2">
              <Button disabled>{status === 'connecting' ? 'Connecting…' : 'Connect'}</Button>
              <Button variant="secondary" disabled>Mic</Button>
              <div className="text-xs text-neutral-600">Status: {status}</div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Model</div>
              <Select value={model} onChange={(e) => setModel(e.target.value)} disabled>
                <option value="gpt-5-realtime">gpt-5-realtime</option>
                <option value="gpt-5">gpt-5</option>
              </Select>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3 text-[13px] text-neutral-700 bg-neutral-50">Realtime token issuance will be available once the OpenAI realtime API is released.</div>
          </div>
        </RightPane>
      }
    />
  );
}


