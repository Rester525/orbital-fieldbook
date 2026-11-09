import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFileSync} from 'node:fs';
const tick=()=>new Promise(r=>setTimeout(r,30));let n=0;
async function setup(owner=true){
 const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
 globalThis.document=document;globalThis.window=window;globalThis.location={hash:'#mentor',replace(h){this.hash=h;}};
 window.scrollTo=()=>{};window.HTMLElement.prototype.focus=function(){};
 const saved=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v),removeItem:k=>saved.delete(k)},configurable:true});
 let listener;const calls=[];let denied=false;
 const client={auth:{getSession:async()=>({data:{session:{user:{id:'viewer'}}},error:null}),onAuthStateChange(fn){listener=fn;}},from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:null,error:null})})})}),rpc:async name=>{calls.push(name);if(name==='mentor_access_status')return {data:{is_mentor:owner},error:null};if(denied)return {data:null,error:{code:'42501',message:'denied'}};return {data:{total:1,fetched_at:'2026-11-09T20:00:00Z',members:[{user_id:'00000000-0000-4000-8000-000000000001',email:'student-visible-only-to-owner@example.invalid',created_at:'2026-11-01T00:00:00Z',last_sign_in_at:'2026-11-09T19:00:00Z',is_mentor:false,last_synced_at:null,has_progress:false,completed_weeks:null,completed_steps:null,practice_attempts:null,mcq_attempts:null,mcq_correct:null}]},error:null};}};
 const priorSDK=window.supabase,priorFetch=globalThis.fetch;window.supabase={createClient:()=>client};globalThis.fetch=async p=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../public/'+String(p).replace(/^\.\//,''),import.meta.url),'utf8'))});
 await import(`../public/js/app.js?mentor-route-${++n}`);await tick();
 return {document,window,saved,calls,signout(){listener('SIGNED_OUT',null);},deny(){denied=true;},restore(){window.supabase=priorSDK;globalThis.fetch=priorFetch;}};
}
test('owner gets discoverable mentor route with real RPC rows and signout clears it',async()=>{
 const s=await setup(true);try{
  assert.ok(s.document.querySelector('#mentor-nav'),'dedicated mentor navigation');assert.equal(s.document.querySelector('#mentor-nav').hidden,false);
  assert.match(s.document.querySelector('#main').textContent,/Mentor dashboard/);assert.match(s.document.querySelector('#main').textContent,/student-visible-only-to-owner/);
  assert.ok(s.calls.includes('mentor_team_roster'));assert.doesNotMatch([...s.saved.values()].join(''),/student-visible-only-to-owner/);
  s.signout();await tick();assert.equal(s.document.querySelector('#mentor-nav').hidden,true);assert.doesNotMatch(s.document.body.textContent,/student-visible-only-to-owner/);
 }finally{s.restore();}
});
test('student direct mentor route does not request roster or show mentor navigation',async()=>{
 const s=await setup(false);try{assert.equal(s.document.querySelector('#mentor-nav').hidden,true);assert.match(s.document.querySelector('#main').textContent,/Mentor access required/);assert.ok(!s.calls.includes('mentor_team_roster'));}finally{s.restore();}
});
