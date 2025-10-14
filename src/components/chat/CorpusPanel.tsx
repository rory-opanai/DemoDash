"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface UploadedFile { fileId: string; filename: string; bytes: number }

export function CorpusPanel({ corpusId, setCorpusId, onUpload, files, setFiles }: { corpusId: string; setCorpusId: (v: string) => void; onUpload: (files: FileList) => Promise<UploadedFile[]>; files: UploadedFile[]; setFiles: (f: UploadedFile[]) => void; }) {
  const [pending, setPending] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const fl = e.target.files;
    if (!fl || fl.length === 0) return;
    setPending(true);
    const items = await onUpload(fl);
    setFiles([...(files || []), ...items]);
    setPending(false);
    e.currentTarget.value = "";
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-[13px] font-medium text-neutral-800">Session Corpus</div>
        <div className="mt-2 flex items-center gap-2">
          <Input value={corpusId} onChange={(e) => setCorpusId(e.target.value)} />
          <Button variant="secondary" onClick={() => setCorpusId(`corpus_${Math.random().toString(36).slice(2,8)}`)}>New</Button>
          <Button variant="secondary" onClick={() => setFiles([])}>Clear</Button>
        </div>
      </div>
      <div>
        <div className="text-[13px] font-medium text-neutral-800">Upload files</div>
        <input aria-label="Upload files" type="file" multiple className="mt-2" onChange={handleUpload} />
        <div className="mt-2 space-y-2">
          {files?.map((f) => (
            <div key={f.fileId} className="flex items-center justify-between rounded-xl border border-neutral-200 p-2 text-[13px]">
              <div>{f.filename} <span className="text-neutral-500">({Math.round(f.bytes/1024)} KB)</span></div>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[12px]">{f.fileId}</span>
            </div>
          ))}
          {pending ? <div className="text-[12px] text-neutral-500">Uploading…</div> : null}
        </div>
      </div>
    </div>
  );
}


