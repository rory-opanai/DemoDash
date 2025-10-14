"use client";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useAuthStore } from "@/stores/authStore";
import { useAppStore } from "@/stores/appStore";

export default function Page() {
  const token = useAuthStore((s) => s.byokToken);
  const setToken = useAuthStore((s) => s.setByokToken);
  const model = useAuthStore((s) => s.model);
  const setModel = useAuthStore((s) => s.setModel);

  const showCurl = useAppStore((s) => s.showCurl);
  const setShowCurl = useAppStore((s) => s.setShowCurl);
  const showLatency = useAppStore((s) => s.showLatencyHud);
  const setShowLatency = useAppStore((s) => s.setShowLatencyHud);
  const reducedMotion = useAppStore((s) => s.reducedMotion);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);

  const [status, setStatus] = useState<'unset'|'ok'|'invalid'>(token ? 'ok' : 'unset');
  const [draft, setDraft] = useState(token);
  useEffect(() => { setDraft(token); }, [token]);

  function validate() {
    const t = (draft || '').trim();
    if (t) {
      setToken(t);
      setStatus('ok');
    } else {
      setStatus('invalid');
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 space-y-4">
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-3">Bring your own key (BYOK)</h2>
          <p className="text-[13px] text-neutral-600">Stored locally in your browser via Zustand persist. Phase 1 does not use it.</p>
          <div className="flex gap-3">
            <Input aria-label="OpenAI API Key" placeholder="sk-..." value={draft} onChange={(e) => setDraft(e.target.value)} />
            <Button onClick={validate}>Save</Button>
            <Button variant="secondary" onClick={() => { setDraft(''); setToken(''); setStatus('unset'); }}>Clear</Button>
          </div>
          <div className="text-[13px] text-neutral-700">Status: {status === 'ok' ? <span className="rounded-full bg-green-100 text-green-800 px-2 py-0.5 text-[12px]">Saved locally</span> : status === 'invalid' ? <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[12px]">Invalid</span> : <span className="rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 text-[12px]">Not set</span>}</div>
        </section>
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 space-y-4">
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-3">Model</h2>
          <div className="flex gap-3">
            <Select value={model} onChange={(e) => setModel(e.target.value)} aria-label="Model picker">
              <option value="gpt-5">gpt-5</option>
              <option value="gpt-5-mini">gpt-5-mini</option>
              <option value="sora-2">sora-2</option>
              <option value="gpt-5-realtime">gpt-5-realtime</option>
            </Select>
            <Button variant="secondary" onClick={() => navigator.clipboard.writeText(model)}>Copy</Button>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 space-y-4">
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-3">Toggles</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-neutral-800">Show CURL</div>
                <div className="text-[13px] text-neutral-600">Display a placeholder CURL drawer for actions.</div>
              </div>
              <Switch checked={showCurl} onChange={(e: any) => setShowCurl(e.target.checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-neutral-800">Show latency HUD</div>
                <div className="text-[13px] text-neutral-600">Static mock token throughput.</div>
              </div>
              <Switch checked={showLatency} onChange={(e: any) => setShowLatency(e.target.checked)} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-neutral-800">Enable reduced motion</div>
                <div className="text-[13px] text-neutral-600">Prefer minimal animations.</div>
              </div>
              <Switch checked={reducedMotion} onChange={(e: any) => setReducedMotion(e.target.checked)} />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 space-y-4">
          <h2 className="text-[15px] font-semibold text-neutral-900 mb-3">Connector status</h2>
          <div className="grid grid-cols-1 gap-3">
            {['Salesforce','HubSpot','Slack','Google Calendar'].map((n) => (
              <div key={n} className="flex items-center justify-between rounded-xl border border-neutral-200 p-3">
                <div className="text-[14px]">{n}</div>
                <span className="rounded-full bg-neutral-100 text-neutral-700 px-2 py-0.5 text-[12px]">Not connected</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

