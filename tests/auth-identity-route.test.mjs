import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {defaultState} from '../public/js/storage.js';
import {accountKey} from '../public/js/cloud-sync.js';
test('external account change interrupts an active account exam without mixing private caches',async()=>{
 const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 globalThis.document=document;globalThis.window=window;globalThis.location={hash:'#practice',replace(h){this.hash=h;}};window.scrollTo=()=>{};window.HTMLElement.prototype.focus=function(){};
 const priorFetch=globalThis.fetch,priorSDK=window.supabase,priorSet=globalThis.setInterval,priorClear=globalThis.clearInterval;
 const timers=new Set();globalThis.setInterval=()=>{const id={};timers.add(id);return id;};globalThis.clearInterval=id=>timers.delete(id);
 const a=defaultState(),b=defaultState(),now=Date.now();a.notes[0]='private A';b.notes[0]='private B';a.exam={questionIds:[],answers:{},startedAt:now,endsAt:now+3000000,submitted:false};
 const rows={a,b},requests=[],map=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)},configurable:true});
 let listener;const client={auth:{getSession:async()=>({data:{session:{user:{id:'a'}}},error:null}),onAuthStateChange(fn){listener=fn;}},rpc:async()=>({data:{is_mentor:false},error:null}),from:()=>({select:()=>({eq:(_,id)=>({maybeSingle:async()=>{requests.push(id);return {data:{state:rows[id],revision:1},error:null};}})})})};
 window.supabase={createClient:()=>client};globalThis.fetch=async p=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../public/'+String(p).replace(/^\.\//,''),import.meta.url),'utf8'))});
 const tick=()=>new Promise(r=>setTimeout(r,30));
 try{
  await import('../public/js/app.js?identity-switch-regression');await tick();assert.equal(document.body.classList.contains('exam-active'),true);
  listener('SIGNED_IN',{user:{id:'b'}});await tick();
  assert.ok(requests.includes('b'),'new auth identity must not wait for exam submission');assert.equal(document.body.classList.contains('exam-active'),false);assert.equal(timers.size,0);
  assert.equal(JSON.parse(map.get(accountKey('a'))).notes[0],'private A');assert.equal(JSON.parse(map.get(accountKey('a'))).exam.submitted,false);
  assert.equal(JSON.parse(map.get(accountKey('b'))).notes[0],'private B');
 }finally{listener?.('SIGNED_OUT',null);await tick();globalThis.fetch=priorFetch;window.supabase=priorSDK;globalThis.setInterval=priorSet;globalThis.clearInterval=priorClear;}
});
