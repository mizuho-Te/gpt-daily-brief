import { open, readFile, rename, mkdir, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import { emptyState, validateState, type State } from './core.js';
export async function readState(path:string):Promise<State> { try { return validateState(JSON.parse(await readFile(path,'utf8'))); } catch(e) { if((e as NodeJS.ErrnoException).code==='ENOENT') return emptyState(); throw e; } }
export async function writeState(path:string,state:State):Promise<void> {
 validateState(state); await mkdir(dirname(path),{recursive:true});
 const temp=path+'.'+randomUUID()+'.tmp';
 const f=await open(temp,'wx',0o600);
 try { await f.writeFile(JSON.stringify(state,null,2)); await f.sync(); } finally { await f.close(); }
 try { await rename(temp,path); } catch(e) { await unlink(temp).catch(()=>{}); throw e; }
}
// Hold this for the entire collect-preview-deliver-commit cycle. Never auto-delete stale locks.
export async function withLock<T>(path:string,action:()=>Promise<T>):Promise<T> {
 await mkdir(dirname(path),{recursive:true}); const lock=await open(path+'.lock','wx',0o600);
 try { return await action(); } finally { await lock.close(); await unlink(path+'.lock'); }
}
