"use client";
import { useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { CorpusPanel, UploadedFile } from '@/components/chat/CorpusPanel';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/authStore';
import { InspectorDrawer } from '@/components/chat/InspectorDrawer';

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [corpusId, setCorpusId] = useState(`corpus_${Math.random().toString(36).slice(2,8)}`);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [inspectorOpen, setInspectorOpen] = useState(false);
  const [results, setResults] = useState<{ id: string; text: string; score: number }[]>([]);
  const token = useAuthStore((s) => s.byokToken);

  async function upload(filesList: FileList) {
    const docs = await Promise.all(
      Array.from(filesList).map(async (f) => ({
        id: `${f.name}-${crypto.randomUUID()}`,
        filename: f.name,
        bytes: f.size,
        text: await f.text()
      }))
    );
    await fetch('/api/embeddings/index', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token || '' },
      body: JSON.stringify({
        corpusId,
        docs: docs.map((doc) => ({ id: doc.id, text: doc.text, meta: { filename: doc.filename } }))
      })
    });
    return docs.map((doc) => ({ fileId: doc.id, filename: doc.filename, bytes: doc.bytes }));
  }

  async function runSearch() {
    const me: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, me]);
    setPrompt('');
    const r = await fetch('/api/embeddings/search', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token || '' }, body: JSON.stringify({ corpusId, query: me.content, topK: 5 }) });
    const data = await r.json();
    setResults(data.results);
    setInspectorOpen(true);
  }

  return (
    <>
      <ChatFeaturePage
        title="Embeddings Search"
        subtitle="Chat over a selected corpus; Dev Inspector shows top‑K."
        messages={messages}
        right={
          <RightPane>
            <div className="space-y-6">
              <CorpusPanel corpusId={corpusId} setCorpusId={setCorpusId} onUpload={async (fl) => {
                const items = await upload(fl);
                setFiles((prev) => [...prev, ...items]);
                return items;
              }} files={files} setFiles={setFiles} />
              <div>
                <div className="text-[13px] font-medium text-neutral-800 mb-2">Prompt</div>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask a question or search…" />
                <div className="mt-3 flex items-center justify-between">
                  <Button variant="secondary" onClick={() => setInspectorOpen(true)}>Open Dev Inspector</Button>
                  <Button onClick={runSearch} disabled={!prompt.trim()}>Send</Button>
                </div>
              </div>
            </div>
          </RightPane>
        }
      />
      <InspectorDrawer open={inspectorOpen} onOpenChange={setInspectorOpen} results={results} />
    </>
  );
}


