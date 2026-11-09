import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultState,exportState,STORAGE_KEY} from '../public/js/storage.js';
import {createCloudSync,accountKey,isRelevantStorageKey} from '../public/js/cloud-sync.js';

function fixture(){
 const map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const rows=new Map(), writes=[];let offline=false;
 const client={from:()=>({select:()=>({eq:(_,id)=>({maybeSingle:async()=>offline?{error:Error('offline')}:{data:rows.get(id)??null,error:null}})})}),rpc:async(_,args)=>{writes.push(args);if(offline)return {error:Error('offline')};const old=rows.get(current);if((old?.revision??0)!==args.p_expected_revision)return {error:Error('stale revision')};rows.set(current,{state:args.p_state,revision:(old?.revision??0)+1});return {data:(old?.revision??0)+1,error:null};}};
 let current='a',state,status;const backups=[];
 const sync=createCloudSync({client,storage,onState:s=>{state=s;},onStatus:s=>{status=s;},backup:s=>backups.push(exportState(s)),delay:5});
 return {map,storage,rows,writes,client,sync,backups,get state(){return state;},get status(){return status;},setCurrent:id=>current=id,setOffline:v=>offline=v};
}
const named=text=>({...defaultState(),notes:[text,'','','']});
test('cloud writes carry their source account and cannot overwrite a newly authenticated account',async()=>{
 const f=fixture();f.rows.set('a',{state:named('private A'),revision:1});f.rows.set('b',{state:named('private B'),revision:1});await f.sync.switchUser('a');
 f.sync.save(named('new private A'));f.setCurrent('b');
 f.client.rpc=async(_,args)=>{f.writes.push(args);if(args.p_user_id&&args.p_user_id!=='b')return {error:{code:'42501',message:'Account changed'}};f.rows.set('b',{state:args.p_state,revision:2});return {data:2};};
 try{await f.sync.retry();assert.equal(f.rows.get('b').state.notes[0],'private B');assert.equal(f.writes.at(-1).p_user_id,'a');assert.equal(f.storage.getItem(accountKey('a')+':dirty'),'1');}finally{f.sync.dispose();}
});
test('account switch isolates guest and users, and sign-out restores guest',async()=>{
 const f=fixture();f.storage.setItem(STORAGE_KEY,exportState(named('guest')));
 await f.sync.switchUser('a');assert.equal(f.state.notes[0],'');assert.equal(f.status.kind,'decision');
 assert.equal(f.sync.save(named('A')),true);await f.sync.retry();assert.equal(f.rows.get('a').state.notes[0],'A');
 f.setCurrent('b');await f.sync.switchUser('b');assert.equal(f.state.notes[0],'');
 assert.equal(f.storage.getItem(STORAGE_KEY),exportState(named('guest')));
 await f.sync.switchUser(null);assert.equal(f.state.notes[0],'guest');
 f.setCurrent('a');await f.sync.switchUser('a');assert.equal(f.state.notes[0],'A');f.sync.dispose();
});
test('overwrite confirmation expires if local work changes during revision refresh',async()=>{
 const f=fixture();f.rows.set('a',{state:named('cloud'),revision:1});await f.sync.switchUser('a');f.sync.save(named('device'));f.rows.set('a',{state:named('other'),revision:2});await f.sync.retry();
 let release;f.client.from=()=>({select:()=>({eq:()=>({maybeSingle:()=>new Promise(resolve=>{release=()=>resolve({data:f.rows.get('a'),error:null});})})})});
 const pending=f.sync.overwriteCloud(true);f.sync.save(named('later edit'));release();assert.equal(await pending,false);
 assert.equal(f.rows.get('a').state.notes[0],'other');f.sync.dispose();
});
test('cloud download aborts if local work changes while fetch is in flight',async()=>{
 const f=fixture();f.rows.set('a',{state:named('remote'),revision:1});await f.sync.switchUser('a');
 let release;f.client.from=()=>({select:()=>({eq:()=>({maybeSingle:()=>new Promise(resolve=>{release=()=>resolve({data:f.rows.get('a'),error:null});})})})});
 const pending=f.sync.downloadCloud();f.sync.save(named('new edit'));release();assert.equal(await pending,false);
 assert.equal(f.storage.getItem(accountKey('a')),exportState(named('new edit')));f.sync.dispose();
});
test('dirty local work never overwrites cloud until explicit resolution',async()=>{
 const f=fixture();f.rows.set('a',{state:named('cloud'),revision:3});
 await f.sync.switchUser('a');assert.equal(f.state.notes[0],'cloud');
 f.sync.save(named('local'));f.rows.set('a',{state:named('other device'),revision:4});
 await f.sync.retry();assert.equal(f.status.kind,'conflict');assert.equal(f.rows.get('a').state.notes[0],'other device');
 await f.sync.downloadCloud();assert.equal(f.state.notes[0],'other device');assert.equal(f.backups.at(-1),exportState(named('local')));f.sync.dispose();
});
test('offline writes stay dirty and retry succeeds after reconnection',async()=>{
 const f=fixture();await f.sync.switchUser('a');f.sync.save(named('queued'));f.setOffline(true);
 await f.sync.retry();assert.equal(f.status.kind,'offline');assert.equal(f.rows.size,0);
 f.setOffline(false);await f.sync.retry();assert.equal(f.rows.get('a').state.notes[0],'queued');assert.equal(f.status.kind,'synced');f.sync.dispose();
});
test('fresh account does not silently migrate guest; import requires explicit action',async()=>{
 const f=fixture();f.storage.setItem(STORAGE_KEY,exportState(named('guest')));await f.sync.switchUser('a');
 assert.equal(f.rows.size,0);await f.sync.importGuest();assert.equal(f.state.notes[0],'guest');assert.equal(f.rows.get('a').state.notes[0],'guest');f.sync.dispose();
});
test('guest import cannot replace unsynced account work even if invoked directly',async()=>{
 const f=fixture();f.storage.setItem(STORAGE_KEY,exportState(named('guest')));await f.sync.switchUser('a');
 f.sync.save(named('private'));await f.sync.switchUser('a');assert.equal(f.status.kind,'decision');assert.equal(await f.sync.importGuest(),false);
 assert.equal(f.storage.getItem(accountKey('a')),exportState(named('private')));f.sync.dispose();
});
test('P0001 stale_revision is a visible conflict, not a silent overwrite',async()=>{
 const f=fixture();f.rows.set('a',{state:named('cloud'),revision:1});await f.sync.switchUser('a');f.sync.save(named('local'));
 f.rows.set('a',{state:named('newer'),revision:2});await f.sync.retry();assert.equal(f.status.kind,'conflict');assert.equal(f.rows.get('a').state.notes[0],'newer');f.sync.dispose();
});
test('cross-tab events only block the active account namespace',()=>{
 assert.equal(isRelevantStorageKey(STORAGE_KEY,'a'),false);
 assert.equal(isRelevantStorageKey(accountKey('b'),'a'),false);
 assert.equal(isRelevantStorageKey(accountKey('a'),'a'),true);
 assert.equal(isRelevantStorageKey(`${accountKey('a')}:dirty`,'a'),true);
 assert.equal(isRelevantStorageKey(STORAGE_KEY,null),true);
});
test('failed dirty marker cannot leave an untracked account write',async()=>{
 const f=fixture();await f.sync.switchUser('a');const original=f.storage.setItem;
 f.storage.setItem=(key,value)=>{if(key.endsWith(':dirty'))throw Error('quota');original(key,value);};
 assert.equal(f.sync.save(named('untracked')),false);assert.equal(f.storage.getItem(`${STORAGE_KEY}:user:a`),null);f.sync.dispose();
});
test('consecutive local edits are preserved while cloud sync is pending',async()=>{
 const f=fixture();await f.sync.switchUser('a');let current=f.state;current.notes[0]='first';f.sync.save(current);current.notes[0]='second';f.sync.save(current);
 await f.sync.retry();assert.equal(f.rows.get('a').state.notes[0],'second');f.sync.dispose();
});
test('corrupt account data can be exported verbatim without changing storage',async()=>{
 const f=fixture();f.storage.setItem(accountKey('a'),'{bad');await f.sync.switchUser('a');
 assert.equal(f.sync.exportUnread(),'{bad');assert.equal(f.storage.getItem(accountKey('a')),'{bad');f.sync.dispose();
});
test('corrupt account data remains untouched and cannot be uploaded',async()=>{
 const f=fixture();f.storage.setItem(`${STORAGE_KEY}:user:a`,'{bad');await f.sync.switchUser('a');
 assert.equal(f.status.kind,'corrupt');assert.equal(f.sync.save(named('new')),false);assert.equal(f.storage.getItem(`${STORAGE_KEY}:user:a`),'{bad');f.sync.dispose();
});
