"use client";

import { useMemo, useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MCPPanel } from '@/components/mcp/MCPPanel';
import { useAuthStore } from '@/stores/authStore';
import { useMCPStore } from '@/stores/useMCPStore';

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.byokToken);
  const { activeConnectors, connectorData } = useMCPStore();

  const contextPayload = useMemo(
    () =>
      activeConnectors
        .map((id) => ({ id, data: connectorData[id] }))
        .filter((entry) => entry.data),
    [activeConnectors, connectorData]
  );

  async function send() {
    if (!prompt.trim()) return;
    if (!token) {
      setError('Add your OpenAI API key in Settings before starting a connector-powered chat.');
      return;
    }
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      createdAt: new Date().toISOString()
    };
    const history = [...messages, userMessage];
    setMessages(history);
    setPrompt('');
    setIsLoading(true);
    try {
      const res = await fetch('/api/mcp/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OPENAI-KEY': token
        },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          connectors: contextPayload
        })
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Assistant request failed');
      }
      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.message?.content || '',
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setError(null);
    } catch (err) {
      console.error('MCP chat failed', err);
      const message = err instanceof Error ? err.message : 'Assistant request failed.';
      setError(message);
      const failure: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: `⚠️ ${message}`,
        createdAt: new Date().toISOString()
      };
      setMessages((prev) => [...prev, failure]);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <ChatFeaturePage
      title="Connector Copilot"
      subtitle="Blend CRM, support, and workspace context into a single chat."
      messages={messages}
      right={
        <RightPane className="space-y-6">
          <MCPPanel />
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-4 text-[12px] text-neutral-600">
            Connect any combination of tools to enrich the assistant prompt. The payload preview shows exactly what will be
            appended to the system message.
          </div>
          {contextPayload.length ? (
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-[12px] text-neutral-700 space-y-2">
              <div className="font-medium text-neutral-900 text-[13px]">Active connectors</div>
              <ul className="space-y-1">
                {contextPayload.map((entry) => (
                  <li key={entry.id} className="flex items-center justify-between">
                    <span className="capitalize">{entry.id}</span>
                    <span className="text-neutral-500">payload ready</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div>
          ) : null}
          <div>
            <div className="text-[13px] font-medium text-neutral-800 mb-2">Prompt</div>
            <Textarea
              rows={5}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask about renewals, support incidents, or project plans…"
            />
            <div className="mt-3 flex justify-end">
              <Button onClick={send} disabled={!prompt.trim() || isLoading}>
                {isLoading ? 'Thinking…' : 'Send'}
              </Button>
            </div>
          </div>
        </RightPane>
      }
    />
  );
}
