import { acknowledge, emptyState, preview, validateConfig, type Batch } from './core.js';
const source='https://github.com/example/demo-project';
const config=validateConfig({version:1,timezone:'Asia/Tokyo',time:'08:00',sources:[source],destination:'current-chat',mode:'dry-run'});
const events:Batch[]=[{source,ok:true,events:[{id:'issue-1',source,updatedAt:'2026-10-21T00:00:00Z',title:'Synthetic example: fix mobile layout',url:source+'/issues/1'},{id:'issue-2',source,updatedAt:'2026-10-21T01:00:00Z',title:'Synthetic example: review onboarding copy',url:source+'/issues/2'}]}];
const first=preview(config,emptyState(),events,'2026-10-21T02:00:00Z');
console.log('OFFLINE FIXTURE ONLY. No network, no GPT, no Slack, no schedule.\n'+first.text);
const simulated=acknowledge(emptyState(),first,first.digest,'confirmed');
console.log('\nSIMULATED acknowledgement only; no message sent.');
console.log('Second run new events:',preview(config,simulated,events,'2026-10-21T03:00:00Z').eventKeys.length);
try { preview(config,simulated,[{source,ok:false,events:[]}],'2026-10-21T04:00:00Z'); } catch(e) { console.log('Failed source:',(e as Error).message); }
