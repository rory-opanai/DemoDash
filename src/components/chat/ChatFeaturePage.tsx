import { ReactNode } from 'react';
import { ChatMessage, ChatPane } from '@/components/chat/ChatPane';

export function ChatFeaturePage({ title, subtitle, messages, right }: { title: string; subtitle?: string; messages: ChatMessage[]; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-6">
      <ChatPane messages={messages} />
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{title}</h1>
          {subtitle ? <p className="text-sm text-neutral-600">{subtitle}</p> : null}
        </div>
        {right}
      </div>
    </div>
  );
}


