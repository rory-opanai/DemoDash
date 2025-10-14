"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChatFeaturePage } from '@/components/chat/ChatFeaturePage';
import { ChatMessage } from '@/components/chat/ChatPane';
import { RightPane } from '@/components/chat/RightPane';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/stores/authStore';

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  const [voice, setVoice] = useState('verse');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore((s) => s.byokToken);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const addAssistantMessage = useCallback((content: string, audioUrl?: string) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content,
      createdAt: new Date().toISOString(),
      attachments: audioUrl ? [{ name: 'Audio reply', size: 0, url: audioUrl }] : undefined
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const sendText = useCallback(async (text?: string, attachment?: { name: string; blob: Blob }) => {
    const content = (text ?? input).trim();
    if (!content) return;
    if (!token) {
      setError('Add your OpenAI API key in Settings before starting a realtime session.');
      return;
    }

    const attachmentUrl = attachment ? URL.createObjectURL(attachment.blob) : undefined;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
      attachments: attachment ? [{ name: attachment.name, size: attachment.blob.size, url: attachmentUrl }] : undefined
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsProcessing(true);
    setError(null);
    try {
      const history = [...messages, userMessage].map(({ role, content }) => ({ role, content }));
      const res = await fetch('/api/realtime/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-OPENAI-KEY': token },
        body: JSON.stringify({ prompt: content, history, model, voice })
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Realtime response failed.');
      }
      const data = await res.json();
      const audioUrl = data.audio ? `data:${data.audioMime};base64,${data.audio}` : undefined;
      addAssistantMessage(data.text || '(no response)', audioUrl);
    } catch (err) {
      console.error('Realtime respond error', err);
      const message = err instanceof Error ? err.message : 'Realtime response failed.';
      setError(message);
      addAssistantMessage(`⚠️ ${message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [addAssistantMessage, input, messages, model, token, voice]);

  const handleTranscription = useCallback(async (blob: Blob) => {
    if (!token) {
      setError('Add your OpenAI API key in Settings before recording audio.');
      return;
    }
    setIsProcessing(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('audio', blob, 'recording.webm');
      const res = await fetch('/api/realtime/transcribe', {
        method: 'POST',
        headers: { 'X-OPENAI-KEY': token },
        body: fd
      });
      if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Transcription failed.');
      }
      const data = await res.json();
      const text = data.text || '';
      await sendText(text, { name: 'Microphone recording', blob });
    } catch (err) {
      console.error('Transcription error', err);
      const message = err instanceof Error ? err.message : 'Transcription failed.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [sendText, token]);

  const startRecording = useCallback(async () => {
    if (isRecording) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Microphone access is not supported in this browser.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        handleTranscription(blob);
        recorder.stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      setError('Could not access the microphone.');
    }
  }, [handleTranscription, isRecording]);

  const stopRecording = useCallback(() => {
    if (!isRecording) return;
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  }, [isRecording]);

  return (
    <ChatFeaturePage
      title="Realtime Voice + Multimodal"
      subtitle="Record audio or type to receive spoken and written responses."
      messages={messages}
      right={
        <RightPane>
          <div className="space-y-4">
            {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[13px] text-red-700">{error}</div> : null}
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Model</div>
              <Select value={model} onChange={(e) => setModel(e.target.value)}>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="gpt-4o">gpt-4o</option>
              </Select>
            </div>
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Voice</div>
              <Select value={voice} onChange={(e) => setVoice(e.target.value)}>
                <option value="verse">verse</option>
                <option value="alloy">alloy</option>
                <option value="coral">coral</option>
                <option value="nova">nova</option>
                <option value="sage">sage</option>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? 'destructive' : 'default'}>
                {isRecording ? 'Stop Recording' : 'Record Voice'}
              </Button>
              <span className="text-[12px] text-neutral-500">{isRecording ? 'Recording… speak now.' : 'Record up to 30s of audio.'}</span>
            </div>
            <div>
              <div className="text-[13px] font-medium text-neutral-800">Type a message</div>
              <Textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something…" rows={4} />
              <div className="mt-3 flex justify-end">
                <Button onClick={() => sendText()} disabled={!input.trim() || isProcessing}>
                  {isProcessing ? 'Processing…' : 'Send'}
                </Button>
              </div>
            </div>
          </div>
        </RightPane>
      }
    />
  );
}


