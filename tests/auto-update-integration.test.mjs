import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {defaultState,STORAGE_KEY} from '../public/js/storage.js';
import {createCloudSync,accountKey,isRelevantStorageKey} from '../public/js/cloud-sync.js';
import {createExam} from '../public/js/quiz.js';
const tick=()=>new Promise(r=>setTimeout(r,25));let sequence=0;
function events(object){const handlers=new Map();return Object.assign(object,{addEventListener(n,f){if(!handlers.has(n))handlers.set(n,new Set());handlers.get(n).add(f);},removeEventListener(n,f){handlers.get(n)?.delete(f);},emit(n){for(const f of handlers.get(n)||[])f();}});}
async function boot({exam=false,corrupt=false,failSave=false,signed=false}={}){
 const old={fetch:globalThis.fetch,now:Date.now,setInterval:globalThis.setInterval,clearInterval:globalThis.clearInterval,serviceWorker:Object.getOwnPropertyDescriptor(navigator,'serviceWorker')};
 const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 globalThis.document=document;globalThis.window=window;let reloads=0,time=old.now();const intervals=new Map();let id=0;
 globalThis.location={hash:exam?'#practice':'#home',replace(h){this.hash=h;},reload(){reloads++;}};
 Date.now=()=>time;window.scrollTo=()=>{};window.requestAnimationFrame=()=>0;window.HTMLElement.prototype.focus=function(){};window.supabase=undefined;
 window.setInterval=(f,ms)=>{intervals.set(++id,{f,ms});return id;};window.clearInterval=i=>intervals.delete(i);
 const guest=defaultState();guest.notes[0]='keep this guest note';
 if(exam)guest.exam=createExam(JSON.parse(readFileSync(new URL('../public/data/questions-worlds.json',import.meta.url),'utf8')),time);
 const original=corrupt?'unread storage sentinel':JSON.stringify(guest);const saved=new Map([[STORAGE_KEY,original]]),session=new Map(),writes=[];
 Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>saved.get(k)??null,setItem(k,v){if(failSave)throw Error('quota');writes.push(k);saved.set(k,v);},removeItem(k){writes.push(k);saved.delete(k);}}});
 Object.defineProperty(window,'sessionStorage',{configurable:true,value:{getItem:k=>session.get(k)??null,setItem:(k,v)=>session.set(k,v),removeItem:k=>session.delete(k)}});
 let remote=defaultState(),revision=1;remote.notes[0]='saved account note';
 const client={auth:{onAuthStateChange(){},getSession:async()=>({data:{session:{user:{id:'account-a'}}}})},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{state:remote,revision}})})})}),rpc:async(name,args)=>{if(name==='mentor_access_status')return {data:{is_mentor:false}};remote=args.p_state;return {data:++revision};}};
 if(signed)window.supabase={createClient:()=>client};
 const messages=[];const reg=events({active:{},waiting:{postMessage:m=>messages.push(m)},installing:null,update:async()=>{}});
 const sw=events({controller:{},register:async()=>reg});Object.defineProperty(navigator,'serviceWorker',{value:sw,configurable:true});
 globalThis.fetch=async file=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../public/'+String(file).replace(/^\.\//,''),import.meta.url),'utf8'))});
 await import(`../public/js/app.js?auto-update-integration-${++sequence}`);await tick();
 if(!exam&&!signed){document.querySelector('#entry-guest').click();await tick();}
 const editNote=()=>{location.hash='#notes';window.dispatchEvent(new window.Event('hashchange'));const area=document.querySelector('[data-note="0"]');area.value='new unsynced reasoning';area.dispatchEvent(new window.Event('input',{bubbles:true}));location.hash='#home';window.dispatchEvent(new window.Event('hashchange'));};
 if(failSave)editNote();
 return {saved,writes,client,storage:window.localStorage,editNote,session,messages,original,get reloads(){return reloads;},advance(){time+=20000;for(const t of intervals.values())if(t.ms===10000)t.f();},activate(){sw.controller={};sw.emit('controllerchange');},restore(){window.dispatchEvent(new window.Event('pagehide'));globalThis.fetch=old.fetch;Date.now=old.now;globalThis.setInterval=old.setInterval;globalThis.clearInterval=old.clearInterval;if(old.serviceWorker)Object.defineProperty(navigator,'serviceWorker',old.serviceWorker);else delete navigator.serviceWorker;}};
}
test('signed-in update and reboot stay clean and do not notify same-account tabs',async()=>{
 const s=await boot({signed:true});let next;try{
  s.writes.length=0;s.advance();assert.equal(s.messages.length,1);s.activate();assert.equal(s.reloads,1);
  assert.equal(s.saved.get(accountKey('account-a')+':dirty'),undefined,'no artificial dirty marker');
  assert.equal(s.writes.filter(k=>isRelevantStorageKey(k,'account-a')).length,0,'no update-generated storage event in another account tab');
  next=createCloudSync({client:s.client,storage:s.storage});await next.switchUser('account-a');assert.equal(next.status.kind,'synced');assert.equal(next.status.dirty,false);
 }finally{next?.dispose();s.restore();}
});

test('genuinely pending account changes postpone automatic reload until sync finishes',async()=>{
 const s=await boot({signed:true});try{
  s.editNote();s.advance();assert.equal(s.messages.length,0);s.activate();assert.equal(s.reloads,0);
  assert.equal(s.saved.get(accountKey('account-a')+':dirty'),'1');
  assert.equal(JSON.parse(s.saved.get(accountKey('account-a'))).notes[0],'new unsynced reasoning');
  await new Promise(r=>setTimeout(r,800));s.advance();assert.equal(s.reloads,1);
 }finally{s.restore();}
});

test('real app auto-update preserves saved guest work and guest choice for reload',async()=>{
 const s=await boot();try{s.advance();assert.equal(s.messages.length,1);s.activate();assert.equal(s.reloads,1);assert.equal(JSON.parse(s.saved.get(STORAGE_KEY)).notes[0],'keep this guest note');assert.equal(s.session.get('orbital-fieldbook:update-guest'),'1');}finally{s.restore();}
});
for(const options of [{exam:true},{corrupt:true},{failSave:true}])test(`real app defers updates for ${Object.keys(options)[0]}`,async()=>{
 const s=await boot(options);try{s.advance();assert.equal(s.messages.length,0);s.activate();assert.equal(s.reloads,0);assert.equal(s.saved.get(STORAGE_KEY),s.original);}finally{s.restore();}
});
