#!/usr/bin/env tsx
/* Minimal E2E API smoke runner */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';

type TestResult = { name: string; ok: boolean; status: number; durationMs: number; asserts?: number; info?: any; error?: string };

const argv = process.argv.slice(2);
function arg(name: string, def?: string) {
  const idx = argv.indexOf(`--${name}`);
  if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1];
  if (name === 'base') return process.env['BASE_URL'] || def;
  if (name === 'key') return process.env['OPENAI_API_KEY'] || def;
  if (name === 'timeout') return process.env['TIMEOUT_MS'] || def;
  return def;
}

const BASE = (arg('base', 'http://localhost:3000') || '').replace(/\/$/, '');
const KEY = arg('key', '');
const TIMEOUT_MS = parseInt(arg('timeout', '120000')!, 10);
const VERBOSE = argv.includes('--verbose');

export const ASSETS_DIR = path.resolve(process.cwd(), 'tests/assets');
export const KNOWLEDGE_DIR = path.join(ASSETS_DIR, 'knowledge');
export const EMBEDDINGS_DIR = path.join(ASSETS_DIR, 'embeddings');
export const SCHEMAS_DIR = path.join(ASSETS_DIR, 'schemas');

function mustExist(p: string) { if (!fs.existsSync(p)) throw new Error(`Required asset missing: ${p}`); }
async function assertAssets() {
  const required = [
    'sample.txt','sample.pdf','sample.png',
    'knowledge/doc1.txt','knowledge/doc2.txt','knowledge/doc3.txt',
    'embeddings/embed1.txt','embeddings/embed2.txt',
    'schemas/contractSummary.schema.json','schemas/salesForecast.schema.json','schemas/piiExtract.schema.json'] as const;
  for (const rel of required) mustExist(path.join(ASSETS_DIR, rel));
}

async function readAsset(rel: string): Promise<Buffer> { return await fsp.readFile(path.join(ASSETS_DIR, rel)); }
async function listAssetDir(subdir: 'knowledge'|'embeddings') { return (await fsp.readdir(path.join(ASSETS_DIR, subdir))).map((f) => path.join(ASSETS_DIR, subdir, f)); }
async function readSchema(name: 'contractSummary'|'salesForecast'|'piiExtract') {
  const file = name==='contractSummary'?'contractSummary.schema.json':name==='salesForecast'?'salesForecast.schema.json':'piiExtract.schema.json';
  return JSON.parse(await fsp.readFile(path.join(SCHEMAS_DIR,file),'utf8'));
}
function pretty(obj:any){ try{return JSON.stringify(obj,null,2);}catch{return String(obj);} }
async function sleep(ms:number){ return new Promise(r=>setTimeout(r,ms)); }
async function withTimeout<T>(p:Promise<T>,ms:number,name='operation'){ let t:any; const timeout=new Promise<never>((_,rej)=>{t=setTimeout(()=>rej(new Error(`Timeout after ${ms}ms: ${name}`)),ms)}); return Promise.race([p,timeout]).finally(()=>clearTimeout(t)); }
async function poll<T>(fn:()=>Promise<T>, {tries,delayMs}:{tries:number;delayMs:number}){ let last:any; for(let i=0;i<tries;i++){ last=await fn(); if(last && (last.status==='completed'||last.ready||last.posterUrl)) return last; await sleep(delayMs);} return last; }

async function http(pathname:string,{method='GET',body,includeKey=true,headers={}}:any={}){
  const url=`${BASE}${pathname}`; const h:any={...headers}; if(includeKey&&KEY) h['X-OPENAI-KEY']=KEY; const init:any={method,headers:h};
  if(body instanceof FormData){ init.body=body; } else if(body!==undefined){ h['Content-Type']='application/json'; init.body=JSON.stringify(body); }
  const res=await fetch(url,init); const ct=res.headers.get('content-type')||''; const data=ct.includes('application/json')?await res.json().catch(()=>({})) : await res.text();
  return {status:res.status,data,res};
}

async function httpRaw(pathname:string, init?: RequestInit) {
  const url = `${BASE}${pathname}`;
  return await fetch(url, init);
}
async function sseCollect(res:Response,timeoutMs=15000){ if(!res.body) throw new Error('No SSE body'); const reader=res.body.getReader(); const dec=new TextDecoder(); const deltas:string[]=[]; const end=Date.now()+timeoutMs; while(Date.now()<end){ const {value,done}=await reader.read(); if(done) break; const chunk=dec.decode(value); chunk.split('\n\n').forEach((blk)=>{ const line=blk.trim(); if(line.startsWith('data: ')){ try{ const j=JSON.parse(line.slice(6)); if(j.delta) deltas.push(j.delta);}catch{}} }); } return deltas; }
function multipart(files:{name:string;buffer:Buffer;type?:string}[],fields:Record<string,string>={}){ const fd=new FormData(); for(const[k,v]of Object.entries(fields)) fd.append(k,v); for(const f of files){ const blob=new Blob([f.buffer as any],{type:f.type||'application/octet-stream'}); // @ts-ignore
  fd.append('files',blob,f.name);} return fd; }

async function runTest(name:string,fn:()=>Promise<TestResult>):Promise<TestResult>{ const start=Date.now(); try{ const r=await withTimeout(fn(),TIMEOUT_MS,name); const durationMs=Date.now()-start; const asserts=(r as any).asserts ?? 0; const okFinal = r.ok && asserts>0; const line=`${okFinal?'✔':'✖'} ${name.padEnd(30)} ${String(r.status).padEnd(4)} ${(durationMs/1000).toFixed(2)}s${VERBOSE?`  asserts=${asserts}`:''}`; console.log(line); return {...r,durationMs,ok:okFinal,asserts}; }catch(err:any){ const durationMs=Date.now()-start; console.log(`✖ ${name.padEnd(30)} ERR  ${(durationMs/1000).toFixed(2)}s`); return {name,ok:false,status:-1,durationMs,error:err?.message,asserts:0}; } }

async function testAuthPing():Promise<TestResult>{ const {status}=await http('/api/auth/ping'); if(status===404) return {name:'auth/ping (optional)',ok:true,status,durationMs:0,info:'SKIP: not present'} as any; return {name:'auth/ping (optional)',ok:status===200,status,durationMs:0} as any; }
async function testImagesHappy():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/images/generate',{method:'POST',body:{prompt:'a blue cube',size:'512x512',versions:2}}); let ok=status===200 && Array.isArray((data as any).items)&& (data as any).items.length===2; if(ok){ asserts++; const first=(data as any).items[0]; const asset=await httpRaw(first.url); if(asset.status===200) asserts++; ok = ok && asset.status===200; } return {name:'images/generate (happy)',ok,status,durationMs:0,info:data,asserts} as any; }
async function testImagesBadSize():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/images/generate',{method:'POST',body:{prompt:'x',size:'999x999'}}); if(status===400) asserts++; return {name:'images/generate (bad-size)',ok:status===400,status,durationMs:0,info:data,asserts} as any; }
async function testImagesNoKey():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/images/generate',{method:'POST',includeKey:false,body:{prompt:'x'}}); if(status===401) asserts++; return {name:'images/generate (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }
async function testVideoHappy():Promise<TestResult>{ let asserts=0; const r=await http('/api/video/generate',{method:'POST',body:{prompt:'a running dog',seconds:4,versions:2}}); const okBase=r.status===200 && Array.isArray((r.data as any).jobIds)&& (r.data as any).jobIds.length===2; if(okBase) asserts++; let pollOk=false; if(okBase){ const ids:string[]=(r.data as any).jobIds; for(const [idx,id] of ids.entries()){ const job=await poll(async()=>{ const jr=await http(`/api/video/jobs/${id}`); return (jr.data as any); },{tries:4,delayMs:1500}); const ready=job && (job.status==='completed'||job.posterUrl); console.log(`  ↳ poll job ${idx+1} ${ready?'ready':'timeout'} poster=${job?.posterUrl?'yes':'no'}`); if(ready && job.posterUrl){ const asset=await httpRaw(job.posterUrl); if(asset.status===200){ pollOk=true; asserts++; } } else { pollOk=pollOk||ready; } }} return {name:'video/generate (happy)',ok:okBase&&pollOk,status:r.status,durationMs:0,info:r.data,asserts} as any; }
async function testVideoNoKey():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/video/generate',{method:'POST',includeKey:false,body:{prompt:'x'}}); if(status===401) asserts++; return {name:'video/generate (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }
async function testRealtimeToken():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/realtime/token',{method:'POST',body:{sessionId:'test-rt-1'}}); if(status===200||status===501) asserts++; return {name:'realtime/token (happy)',ok:status===200||status===501,status,durationMs:0,info:status===501?'UNAVAILABLE(501)':data,asserts} as any; }
async function testRealtimeNoKey():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/realtime/token',{method:'POST',includeKey:false,body:{sessionId:'test-rt-1'}}); if(status===401) asserts++; return {name:'realtime/token (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }
async function testFilesUploadHappy():Promise<TestResult>{ let asserts=0; const fd=multipart([{name:'sample.txt',buffer:await readAsset('sample.txt'),type:'text/plain'},{name:'sample.pdf',buffer:await readAsset('sample.pdf'),type:'application/pdf'}]); const {status,data}=await http('/api/files/upload',{method:'POST',body:fd}); const ok=status===200 && Array.isArray((data as any).items) && (data as any).items.length===2; if(ok) asserts++; return {name:'files/upload (happy)',ok,status,durationMs:0,info:data,asserts} as any; }
async function testFilesList():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/files/list'); const ok=status===200 && Array.isArray((data as any).items); if(ok) asserts++; return {name:'files/list',ok,status,durationMs:0,info:data,asserts} as any; }
async function testFilesOversize():Promise<TestResult>{ let asserts=0; const big=Buffer.alloc(26*1024*1024,0); const fd=multipart([{name:'big.bin',buffer:big}]); const {status,data}=await http('/api/files/upload',{method:'POST',body:fd}); if(status===413) asserts++; return {name:'files/upload (oversize)',ok:status===413,status,durationMs:0,info:data,asserts} as any; }
async function testFilesNoKey():Promise<TestResult>{ let asserts=0; const fd=multipart([{name:'sample.txt',buffer:await readAsset('sample.txt'),type:'text/plain'}]); const {status}=await http('/api/files/upload',{method:'POST',includeKey:false,body:fd}); if(status===401) asserts++; return {name:'files/upload (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }
async function testKnowledgeHappy(fileId:string):Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/knowledge/ask',{method:'POST',body:{sessionId:'s1',corpusId:'c1',messages:[{role:'user',content:'What does the file say?'}],fileIds:[fileId],guardrails:true}}); const ok=status===200 && (data as any).message && typeof (data as any).message.content==='string'; if(ok) asserts++; return {name:'knowledge/ask (happy)',ok,status,durationMs:0,info:data,asserts} as any; }
async function testKnowledgeGuardrailsNoFiles():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/knowledge/ask',{method:'POST',body:{sessionId:'s1',corpusId:'c1',messages:[{role:'user',content:'Q'}],guardrails:true}}); if(status===400) asserts++; return {name:'knowledge/ask (guardrails no files)',ok:status===400||status===200,status,durationMs:0,info:data,asserts} as any; }
async function testKnowledgeNoKey():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/knowledge/ask',{method:'POST',includeKey:false,body:{sessionId:'s1',corpusId:'c1',messages:[{role:'user',content:'Q'}]}}); if(status===401) asserts++; return {name:'knowledge/ask (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }
async function testEmbeddingsIndex(corpusId:string):Promise<TestResult>{ let asserts=0; const files=await fsp.readdir(EMBEDDINGS_DIR); const docs=await Promise.all(files.map(async f=>({id:f,text:await fsp.readFile(path.join(EMBEDDINGS_DIR,f),'utf8')}))); const {status,data}=await http('/api/embeddings/index',{method:'POST',body:{corpusId,docs}}); const ok=status===200 && (data as any).count>=2; if(ok) asserts++; return {name:'embeddings/index (happy)',ok,status,durationMs:0,info:data,asserts} as any; }
async function testEmbeddingsSearch(corpusId:string):Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/embeddings/search',{method:'POST',body:{corpusId,query:'banana',topK:3}}); const ok=status===200 && Array.isArray((data as any).results) && (data as any).results.length>=1 && typeof (data as any).results[0].score==='number'; if(ok) asserts++; return {name:'embeddings/search (happy)',ok,status,durationMs:0,info:data,asserts} as any; }
async function testEmbeddingsNoKey():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/embeddings/index',{method:'POST',includeKey:false,body:{corpusId:'c1',docs:[]}}); if(status===401) asserts++; return {name:'embeddings/index (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }
async function testStructuredHappy():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/structured/run',{method:'POST',body:{sessionId:'s1',messages:[{role:'user',content:'Summarize: ACME and Bob 2024-01-05 $1M.'}],schemaId:'contractSummary'}}); const ok=status===200 && !!(data as any).message?.json; if(ok) asserts++; return {name:'structured/run (happy)',ok,status,durationMs:0,info:data,asserts} as any; }
async function testStructuredBadSchema():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/structured/run',{method:'POST',body:{sessionId:'s1',messages:[{role:'user',content:'x'}],schemaId:'unknown'}}); if(status===400) asserts++; return {name:'structured/run (bad-schema)',ok:status===400,status,durationMs:0,info:data,asserts} as any; }
async function testStructuredNoKey():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/structured/run',{method:'POST',includeKey:false,body:{sessionId:'s1',messages:[{role:'user',content:'x'}],schemaId:'contractSummary'}}); if(status===401) asserts++; return {name:'structured/run (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }
async function testSupportSSE():Promise<TestResult>{ let asserts=0; const res=await fetch(`${BASE}/api/support/chat`,{method:'POST',headers:{'Content-Type':'application/json','X-OPENAI-KEY':KEY as string},body:JSON.stringify({sessionId:'s1',messages:[{role:'user',content:'hello'}],tone:'friendly'})}); const deltas=await sseCollect(res,20000).catch(()=>[]); const ok=deltas.length>0; if(ok) asserts++; return {name:'support/chat (SSE)',ok,status:res.status,durationMs:0,info:{deltas:deltas.length},asserts} as any; }
async function testSupportNoKey():Promise<TestResult>{ let asserts=0; const res=await fetch(`${BASE}/api/support/chat`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId:'s1',messages:[{role:'user',content:'hello'}]})}); if(res.status===401) asserts++; return {name:'support/chat (no-key)',ok:res.status===401,status:res.status,durationMs:0,asserts} as any; }
async function testForecastHappy():Promise<TestResult>{ let asserts=0; const {status,data}=await http('/api/forecast/run',{method:'POST',body:{sessionId:'s1',period:'weekly',region:'EMEA'}}); const ok=status===200 && (data as any).message?.chart?.stages?.length>=1; if(ok) asserts++; return {name:'forecast/run (happy)',ok,status,durationMs:0,info:data,asserts} as any; }
async function testForecastBadPeriod():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/forecast/run',{method:'POST',body:{sessionId:'s1',period:'invalid',region:'EMEA'}}); if(status===400) asserts++; return {name:'forecast/run (bad-period)',ok:status===400,status,durationMs:0,asserts} as any; }
async function testForecastNoKey():Promise<TestResult>{ let asserts=0; const {status}=await http('/api/forecast/run',{method:'POST',includeKey:false,body:{sessionId:'s1',period:'weekly'}}); if(status===401) asserts++; return {name:'forecast/run (no-key)',ok:status===401,status,durationMs:0,asserts} as any; }

async function main(){
  console.log(`API Smoke — base=${BASE}, assets=${ASSETS_DIR}`);
  await assertAssets();
  const kfile=await fsp.readFile(path.join(KNOWLEDGE_DIR,'doc1.txt'));
  const kfd=multipart([{name:'doc1.txt',buffer:kfile,type:'text/plain'}]);
  const kup=await http('/api/files/upload',{method:'POST',body:kfd});
  const knowledgeFileId=(kup.data as any)?.items?.[0]?.fileId || 'file_mock';
  const corpusId='corpus_smoke_1';
  const tests:[string,()=>Promise<TestResult>][]=[
    ['auth/ping (optional)',()=>testAuthPing()],
    ['images/generate (happy)',()=>testImagesHappy()],
    ['images/generate (bad-size)',()=>testImagesBadSize()],
    ['images/generate (no-key)',()=>testImagesNoKey()],
    ['video/generate (happy)',()=>testVideoHappy()],
    ['video/generate (no-key)',()=>testVideoNoKey()],
    ['realtime/token (happy)',()=>testRealtimeToken()],
    ['realtime/token (no-key)',()=>testRealtimeNoKey()],
    ['files/upload (happy)',()=>testFilesUploadHappy()],
    ['files/list',()=>testFilesList()],
    ['files/upload (oversize)',()=>testFilesOversize()],
    ['files/upload (no-key)',()=>testFilesNoKey()],
    ['knowledge/ask (happy)',()=>testKnowledgeHappy(knowledgeFileId)],
    ['knowledge/ask (guardrails no files)',()=>testKnowledgeGuardrailsNoFiles()],
    ['knowledge/ask (no-key)',()=>testKnowledgeNoKey()],
    ['embeddings/index (happy)',()=>testEmbeddingsIndex(corpusId)],
    ['embeddings/search (happy)',()=>testEmbeddingsSearch(corpusId)],
    ['embeddings/index (no-key)',()=>testEmbeddingsNoKey()],
    ['structured/run (happy)',()=>testStructuredHappy()],
    ['structured/run (bad-schema)',()=>testStructuredBadSchema()],
    ['structured/run (no-key)',()=>testStructuredNoKey()],
    ['support/chat (SSE)',()=>testSupportSSE()],
    ['support/chat (no-key)',()=>testSupportNoKey()],
    ['forecast/run (happy)',()=>testForecastHappy()],
    ['forecast/run (bad-period)',()=>testForecastBadPeriod()],
    ['forecast/run (no-key)',()=>testForecastNoKey()],
  ];
  const results:TestResult[]=[]; for(const [name,fn] of tests) results.push(await runTest(name,fn));
  const passed=results.filter(r=>r.ok).length; const failed=results.length-passed; console.log(`\nSUMMARY: ${passed} passed, ${failed} failed`);
  const report={ base:BASE, assets:ASSETS_DIR, ts:new Date().toISOString(), results, passed, failed };
  const outDir=path.resolve(process.cwd(),'.reports'); await fsp.mkdir(outDir,{recursive:true}); await fsp.writeFile(path.join(outDir,'api-smoke.json'),JSON.stringify(report,null,2)); console.log(`Report: .reports/api-smoke.json`);
  process.exit(failed?1:0);
}

main().catch(err=>{ console.error('Fatal:',err); process.exit(1); });


