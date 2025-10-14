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
  const [isSearching, setIsSearching] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.byokToken);

  async function upload(filesList: FileList) {
    if (!token) {
      setLastError('Add your OpenAI API key in Settings before uploading files.');
      return [];
    }
    try {
      const docs = await Promise.all(
        Array.from(filesList).map(async (f) => ({
          id: `${f.name}-${crypto.randomUUID()}`,
          filename: f.name,
          bytes: f.size,
          text: await f.text()
        }))
      );
      const res = await fetch('/api/embeddings/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token },
        body: JSON.stringify({
          corpusId,
          docs: docs.map((doc) => ({ id: doc.id, text: doc.text, meta: { filename: doc.filename } }))
        })
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Failed to index documents.');
      }
      setLastError(null);
      return docs.map((doc) => ({ fileId: doc.id, filename: doc.filename, bytes: doc.bytes }));
    } catch (error) {
      console.error('Embeddings upload failed', error);
      setLastError(error instanceof Error ? error.message : 'Failed to upload files.');
      return [];
    }
  }

  async function runSearch() {
    if (!prompt.trim()) return;
    if (!token) {
      setLastError('Add your OpenAI API key in Settings before running a search.');
      return;
    }
    const me: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: prompt, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, me]);
    setPrompt('');
    setIsSearching(true);
    try {
      const res = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token },
        body: JSON.stringify({ corpusId, query: me.content, topK: 5 })
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Search failed.');
      }
      const data = await res.json();
      const items = (data.results || []) as { id: string; text: string; score: number }[];
      setResults(items);
      setInspectorOpen(true);
      const summary = items.length
        ? items
            .map((item, index) => {
              const score = typeof item.score === 'number' ? (item.score * 100).toFixed(1) : '—';
              const snippet = item.text?.slice(0, 160).replace(/\s+/g, ' ') || 'No preview available';
              return `${index + 1}. score ${score}% — ${snippet}${item.text?.length > 160 ? '…' : ''}`;
            })
            .join('\n')
        : 'No results found.';
      const ai: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: items.length ? `Top ${items.length} matches:\n${summary}` : summary,
        createdAt: new Date().toISOString()
      };
      setMessages((m) => [...m, ai]);
      setLastError(null);
    } catch (error) {
      console.error('Embeddings search failed', error);
      const message = error instanceof Error ? error.message : 'Search failed.';
      setLastError(message);
      const ai: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ ${message}`,
        createdAt: new Date().toISOString()
      };
      setMessages((m) => [...m, ai]);
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <>
      <ChatFeaturePage
        title="Embeddings Search"
        subtitle="Embed a corpus and retrieve the most similar documents in real time."
        messages={messages}
        right={
          <RightPane>
            <div className="space-y-6">
              <CorpusPanel corpusId={corpusId} setCorpusId={setCorpusId} onUpload={async (fl) => {
                const items = await upload(fl);
                setFiles((prev) => [...prev, ...items]);
                return items;
              }} files={files} setFiles={setFiles} />
              {lastError ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{lastError}</div> : null}
              <div>
                <div className="text-[13px] font-medium text-neutral-800 mb-2">Prompt</div>
                <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask a question or search…" rows={5} />
                <div className="mt-3 flex items-center justify-between">
                  <Button variant="secondary" onClick={() => setInspectorOpen(true)}>Open Dev Inspector</Button>
                  <Button onClick={runSearch} disabled={!prompt.trim() || isSearching}>
                    {isSearching ? 'Searching…' : 'Send'}
                  </Button>
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


