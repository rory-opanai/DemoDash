"use client";
import { useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { CorpusPanel, UploadedFile } from '@/components/chat/CorpusPanel';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [tone, setTone] = useState('neutral');
  const [guardrails, setGuardrails] = useState(false);
  const [corpusId, setCorpusId] = useState(`corpus_${Math.random().toString(36).slice(2,8)}`);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.byokToken);

  async function upload(filesList: FileList) {
    if (!token) {
      setError('Add your OpenAI API key in Settings before uploading.');
      return [];
    }
    try {
      const fd = new FormData();
      Array.from(filesList).forEach((f) => fd.append('files', f));
      const res = await fetch('/api/files/upload', { method: 'POST', headers: { 'X-OPENAI-KEY': token }, body: fd });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'File upload failed.');
      }
      const data = await res.json();
      setError(null);
      return data.items as UploadedFile[];
    } catch (err) {
      console.error('Knowledge upload failed', err);
      setError(err instanceof Error ? err.message : 'File upload failed.');
      return [];
    }
  }

  async function ask() {
    if (!prompt.trim()) return;
    if (!token) {
      setError('Add your OpenAI API key in Settings before asking questions.');
      return;
    }
    const me: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() };
    const history = [...messages, me];
    setMessages(history);
    setPrompt('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/knowledge/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token },
        body: JSON.stringify({
          sessionId: 's1',
          corpusId,
          tone,
          guardrails,
          fileIds: files.map((f) => f.fileId),
          messages: history.map(({ role, content }) => ({ role, content }))
        })
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Assistant request failed.');
      }
      const data = await res.json();
      const ai: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message.content,
        citations: data.message.citations,
        createdAt: new Date().toISOString()
      };
      setMessages((m) => [...m, ai]);
      setError(null);
    } catch (err) {
      console.error('Knowledge assistant failed', err);
      const message = err instanceof Error ? err.message : 'Assistant request failed.';
      setError(message);
      const failure: ChatMessage = { id: crypto.randomUUID(), role: 'assistant', content: `⚠️ ${message}`, createdAt: new Date().toISOString() };
      setMessages((m) => [...m, failure]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ChatFeaturePage
      title="Knowledge Assistant"
      subtitle="Ask questions with optional guardrails and uploaded context."
      messages={messages}
      right={
        <RightPane>
          <div className="space-y-6">
            <CorpusPanel corpusId={corpusId} setCorpusId={setCorpusId} onUpload={async (fl) => {
              const items = await upload(fl);
              setFiles((prev) => [...prev, ...items]);
              return items;
            }} files={files} setFiles={setFiles} />
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
            <div>
              <div className="text-[13px] font-medium text-neutral-800 mb-2">Options</div>
              <div className="grid grid-cols-2 gap-3">
                <div><div className="text-[13px] text-neutral-700">Tone</div><Select value={tone} onChange={(e) => setTone(e.target.value)}><option value="neutral">neutral</option><option value="friendly">friendly</option><option value="precise">precise</option></Select></div>
                <div className="flex items-end gap-2"><input id="guard" type="checkbox" className="h-4 w-4" checked={guardrails} onChange={(e) => setGuardrails(e.target.checked)} /><label htmlFor="guard" className="text-[13px]">Answer only from files</label></div>
              </div>
            </div>
            <div>
              <div className="text-[13px] font-medium text-neutral-800 mb-2">Prompt</div>
              <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask a question about your files…" rows={5} />
              <div className="mt-3 flex justify-end"><Button onClick={ask} disabled={!prompt.trim() || (guardrails && files.length === 0) || isLoading}>{isLoading ? 'Thinking…' : 'Ask'}</Button></div>
            </div>
          </div>
        </RightPane>
      }
    />
  );
}


