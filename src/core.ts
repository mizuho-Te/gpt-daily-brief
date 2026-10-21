import { createHash } from 'node:crypto';
export interface Config { version: 1; timezone: string; time: string; sources: string[]; destination: 'current-chat'; mode: 'dry-run'; }
export interface Event { id: string; source: string; updatedAt: string; title: string; url: string; }
export interface State { version: 1; seen: string[]; cursor: string | null; }
export interface Batch { source: string; ok: boolean; events: Event[]; }
export interface Preview { text: string; digest: string; eventKeys: string[]; through: string; }
const record = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export function validSource(value: unknown): value is string { return typeof value === 'string' && /^https:\/\/github\.com\/[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})\/[A-Za-z0-9_.-]{1,100}$/.test(value) && !value.endsWith('/..') && !value.endsWith('/.'); }
export function validateConfig(value: unknown): Config {
 if (!record(value)) throw new Error('Config must be an object');
 const keys = ['version','timezone','time','sources','destination','mode'];
 if (Object.keys(value).some(k=>!keys.includes(k))) throw new Error('Unknown config field');
 if(value.version!==1 || value.mode!=='dry-run' || value.destination!=='current-chat') throw new Error('Only version 1, dry-run, current-chat are supported');
 if(typeof value.timezone!=='string') throw new Error('Timezone required');
 try { new Intl.DateTimeFormat('en',{timeZone:value.timezone}).format(); } catch { throw new Error('Invalid timezone'); }
 if(typeof value.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.time)) throw new Error('Use HH:mm');
 if(!Array.isArray(value.sources)||!value.sources.length||value.sources.length>10||!value.sources.every(validSource)) throw new Error('Use 1–10 exact public GitHub repository URLs');
 if(new Set(value.sources.map(s=>s.toLowerCase())).size!==value.sources.length) throw new Error('Duplicate source');
 return {version:1, timezone:value.timezone,time:value.time,sources:value.sources.map(s=>s.toLowerCase()),destination:'current-chat',mode:'dry-run'};
}
export const emptyState = (): State => ({version:1,seen:[],cursor:null});
export function validateState(value: unknown): State {
 if(!record(value)||value.version!==1||!Array.isArray(value.seen)||!value.seen.every(x=>typeof x==='string') || !(value.cursor===null || typeof value.cursor==='string'&&Number.isFinite(Date.parse(value.cursor)))) throw new Error('Invalid state; do not reset automatically');
 return {version:1,seen:[...new Set(value.seen as string[])],cursor:value.cursor as string|null};
}
export function key(e: Event): string { return createHash('sha256').update(JSON.stringify([e.source.toLowerCase(),e.id,Date.parse(e.updatedAt)])).digest('hex'); }
export function preview(config: Config, state: State, batches: Batch[], through: string): Preview {
 if(!Number.isFinite(Date.parse(through))) throw new Error('Invalid cutoff');
 if(state.cursor && Date.parse(through)<Date.parse(state.cursor)) throw new Error('Clock moved backwards');
 if(batches.length!==config.sources.length || new Set(batches.map(b=>b.source)).size!==batches.length || batches.some(b=>!config.sources.includes(b.source)||!b.ok)) throw new Error('Source collection incomplete: keep prior state and report failure, not no changes');
 const known=new Set(state.seen), unique=new Map<string,Event>();
 for(const batch of batches) for(const e of batch.events) {
  if(e.source!==batch.source || !e.id || !e.title || !Number.isFinite(Date.parse(e.updatedAt)) || !(e.url.startsWith(e.source+'/') && /^(issues|pull)\/[1-9][0-9]*$/.test(e.url.slice(e.source.length+1))) || e.title.length>500) throw new Error('Invalid event');
  if(Date.parse(e.updatedAt)>Date.parse(through)) continue;
  const k=key(e); if(!known.has(k)) unique.set(k,e);
 }
 // Cursor is diagnostic, not a filter: late-arriving old events still get included.
 const entries=[...unique.entries()].sort((a,b)=>Date.parse(a[1].updatedAt)-Date.parse(b[1].updatedAt)||a[0].localeCompare(b[0]));
 const text=entries.length ? ['[SYNTHETIC / RULE-BASED PREVIEW — GPT not called]',...entries.map(([,e])=>`- ${e.title.replace(/[\r\n\x00-\x1f]/g,' ')}\n  ${e.url}`)].join('\n') : '[RULE-BASED PREVIEW] No unseen events in the supplied complete batch.';
 const eventKeys=entries.map(([k])=>k);
 const digest=createHash('sha256').update(JSON.stringify({text,eventKeys,through,destination:config.destination})).digest('hex');
 return {text,digest,eventKeys,through};
}
// Call only after confirmed delivery; a preview or ambiguous timeout is not delivery.
export function acknowledge(state:State,p:Preview,approvedDigest:string,delivery:'confirmed'|'uncertain'|'failed'):State {
 if(approvedDigest!==p.digest) throw new Error('Approval does not match preview');
 if(delivery!=='confirmed') throw new Error('Do not advance state: reconcile delivery manually');
 return {version:1,seen:[...new Set([...state.seen,...p.eventKeys])],cursor:p.through};
}
