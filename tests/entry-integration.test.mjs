import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';
import {defaultState,STORAGE_KEY} from '../public/js/storage.js';
const tick=()=>new Promise(r=>setTimeout(r,25));
let run=0;
async function setup({session,remote,updateGuest=false}={}){
 const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 globalThis.document=document;globalThis.window=window;globalThis.location={hash:'#home',replace(h){this.hash=h;}};
 window.scrollTo=()=>{};window.HTMLElement.prototype.focus=function(){};
 const sessionValues=new Map(updateGuest?[['orbital-fieldbook:update-guest','1']]:[]);
 Object.defineProperty(window,'sessionStorage',{value:{getItem:k=>sessionValues.get(k)??null,setItem:(k,v)=>sessionValues.set(k,v),removeItem:k=>sessionValues.delete(k)},configurable:true});
 const guest=defaultState();guest.notes[0]='private guest note';const saved=new Map([[STORAGE_KEY,JSON.stringify(guest)]]);
 Object.defineProperty(window,'localStorage',{value:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},configurable:true});
 let listener,queries=0;
 const account=defaultState();account.settings.theme='dark';account.notes[0]='private account note';
 const client={auth:{onAuthStateChange(fn){listener=fn;},getSession:()=>session||Promise.resolve({data:{session:{user:{id:'student-a'}}},error:null})},rpc:async()=>({data:{is_mentor:false},error:null}),from(){queries++;return {select(){return {eq(){return {maybeSingle:()=>remote||Promise.resolve({data:{state:account,revision:1},error:null})};}};}};}};
 const priorSDK=window.supabase;window.supabase={createClient:()=>client};
 const priorFetch=globalThis.fetch;globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../public/'+String(path).replace(/^\.\//,''),import.meta.url),'utf8'))});
 await import(`../public/js/app.js?entry-integration-${++run}`);await tick();
 return {document,saved,guest,client,get queries(){return queries;},emit(event,id){listener(event,id?{user:{id}}:null);},restore(){globalThis.fetch=priorFetch;window.supabase=priorSDK;}};
}
test('update reload resumes an explicit guest instead of the saved signed-in account',async()=>{
 const s=await setup({updateGuest:true});try{
  assert.equal(s.document.querySelector('#entry-screen').hidden,true);assert.equal(s.queries,0);
  assert.equal(s.document.documentElement.dataset.theme,'light');assert.equal(s.saved.get(STORAGE_KEY),JSON.stringify(s.guest));
  s.emit('SIGNED_IN','student-a');await tick();assert.equal(s.queries,0);
 }finally{s.restore();}
});

test('saved account enters automatically; signing out returns to login without copying guest work',async()=>{
 const s=await setup();try{
  assert.equal(s.document.querySelector('#entry-screen').hidden,true);assert.equal(s.document.querySelector('.app-shell').hidden,false);
  assert.equal(s.document.documentElement.dataset.theme,'dark');assert.equal(s.queries,1);
  s.emit('SIGNED_OUT',null);await tick();assert.equal(s.document.querySelector('#entry-screen').hidden,false);assert.equal(s.document.querySelector('.app-shell').hidden,true);
  assert.equal(s.saved.get(STORAGE_KEY),JSON.stringify(s.guest));
 }finally{s.restore();}
});
test('guest entry works while session lookup waits and ignores a late saved account',async()=>{
 let resolve;const session=new Promise(r=>{resolve=r;});const s=await setup({session});try{
  s.document.querySelector('#entry-guest').click();await tick();assert.equal(s.document.querySelector('.app-shell').hidden,false);assert.ok(s.document.querySelector('.home-dashboard'));
  resolve({data:{session:{user:{id:'late-account'}}},error:null});await tick();
  assert.equal(s.queries,0);assert.equal(s.document.documentElement.dataset.theme,'light');assert.equal(s.saved.get(STORAGE_KEY),JSON.stringify(s.guest));
  assert.match(s.document.querySelector('#account-button').textContent,/Sign in/);
 }finally{s.restore();}
});
test('guest account-dialog signup opens the name form and preserves guest work',async()=>{
 const s=await setup({session:Promise.resolve({data:{session:null},error:null})});try{
  s.document.querySelector('#entry-guest').click();await tick();
  const dialog=s.document.querySelector('#account-dialog');let closed=false;dialog.close=()=>{closed=true;};
  dialog.querySelector('[data-account-action=signup]').click();await tick();
  assert.equal(closed,true);assert.equal(s.document.querySelector('#entry-screen').hidden,false);
  assert.equal(s.document.querySelector('.app-shell').hidden,true);
  assert.equal(s.document.querySelector('#entry-screen h1').textContent,'Create your account.');
  assert.equal(s.document.querySelector('#entry-name-field').hidden,false);
  assert.equal(s.saved.get(STORAGE_KEY),JSON.stringify(s.guest));
 }finally{s.restore();}
});

test('guest selection cancels an in-flight account download without exposing its late state',async()=>{
 let resolve;const remote=new Promise(r=>{resolve=r;});const s=await setup({remote});try{
  assert.equal(s.queries,1);s.document.querySelector('#entry-guest').click();await tick();
  const account=defaultState();account.settings.theme='dark';resolve({data:{state:account,revision:1},error:null});await tick();
  assert.equal(s.document.documentElement.dataset.theme,'light');assert.equal(s.document.querySelector('#entry-screen').hidden,true);assert.match(s.document.querySelector('#account-button').textContent,/Sign in/);
  assert.equal(s.saved.get(STORAGE_KEY),JSON.stringify(s.guest));
 }finally{s.restore();}
});
