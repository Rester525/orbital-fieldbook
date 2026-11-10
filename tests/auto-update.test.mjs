import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {parseHTML} from 'linkedom';
const tick=()=>new Promise(r=>setImmediate(r));
const moduleURL=new URL('../public/js/auto-update.js',import.meta.url);
function emitter(object={}){
 const listeners=new Map();
 return Object.assign(object,{addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn);},removeEventListener(name,fn){listeners.get(name)?.delete(fn);},emit(name){for(const fn of listeners.get(name)||[])fn();},listenerCount(){return [...listeners.values()].reduce((n,s)=>n+s.size,0);}});
}
async function setup({controlled=true,waiting=true}={}){
 assert.ok(existsSync(moduleURL),'automatic update module is implemented');
 const {startAutoUpdates}=await import(moduleURL);
 const {document,window}=parseHTML('<html><body><p id="status"></p><button id="update" hidden></button><main></main></body></html>');
 let time=0,updates=0,saves=0,reloads=0,ready=true,saveOK=true;const messages=[],timers=new Map();let timerId=0;
 const worker=emitter({state:'installed',postMessage:m=>messages.push(m)});
 const reg=emitter({active:controlled?{}:null,waiting:waiting?worker:null,installing:null,update:async()=>{updates++;}});
 const serviceWorker=emitter({controller:controlled?{}:null,register:async(path,options)=>{assert.equal(path,'./sw.js');assert.equal(options.updateViaCache,'none');return reg;}});
 const win=emitter({setInterval(fn,ms){timers.set(++timerId,{fn,ms});return timerId;},clearInterval(id){timers.delete(id);}});
 const stop=await startAutoUpdates({serviceWorker,win,doc:document,status:document.querySelector('#status'),button:document.querySelector('#update'),now:()=>time,canReload:()=>ready,verifySaved:()=>{saves++;return saveOK;},reload:()=>{reloads++;return true;}});
 return {document,window,win,serviceWorker,reg,worker,messages,timers,stop,get updates(){return updates;},get saves(){return saves;},get reloads(){return reloads;},setReady(v){ready=v;},setSave(v){saveOK=v;},async advance(ms=10000){time+=ms;for(const t of [...timers.values()])if(t.ms<=ms)t.fn();await tick();},changeController(){serviceWorker.controller={};serviceWorker.emit('controllerchange');}};
}

test('autofilled login fields are protected even without an input event',async()=>{
 const s=await setup();try{
  s.document.querySelector('main').innerHTML='<section id="entry-screen"><input type="email" value="learner@example.org"></section>';
  await s.advance();assert.equal(s.messages.length,0);
  s.document.querySelector('#entry-screen').hidden=true;await s.advance();assert.equal(s.messages.length,1);
 }finally{s.stop();}
});

test('manual update bypasses quiet delay but never a safety or save failure',async()=>{
 const s=await setup();try{
  s.setReady(false);s.document.querySelector('#update').click();assert.equal(s.messages.length,0);
  s.setReady(true);s.document.querySelector('#update').click();assert.equal(s.messages.length,1);
 }finally{s.stop();}
});

test('checks again on reconnect, foreground return and every five minutes',async()=>{
 const s=await setup({waiting:false});try{
  s.win.emit('online');await tick();assert.equal(s.updates,2);
  s.document.dispatchEvent(new s.window.Event('visibilitychange'));await tick();assert.equal(s.updates,3);
  await s.advance(300000);assert.equal(s.updates,4);
  s.stop();s.win.emit('online');await s.advance(300000);assert.equal(s.updates,4);assert.equal(s.timers.size,0);assert.equal(s.serviceWorker.listenerCount(),0);
 }finally{s.stop();}
});

test('newly downloaded workers offer and apply an update without a button click',async()=>{
 const s=await setup({waiting:false});try{
  s.worker.state='installing';s.reg.installing=s.worker;s.reg.emit('updatefound');
  s.worker.state='installed';s.reg.waiting=s.worker;s.worker.emit('statechange');
  assert.equal(s.document.querySelector('#update').hidden,false);
  await s.advance();assert.equal(s.messages.length,1);
 }finally{s.stop();}
});

test('failed network update checks retry and never reload the page',async()=>{
 const s=await setup({waiting:false});try{
  s.reg.update=async()=>{throw Error('offline');};s.win.emit('online');await tick();
  assert.match(s.document.querySelector('#status').textContent,/retry|unavailable/i);assert.equal(s.reloads,0);
  let retries=0;s.reg.update=async()=>{retries++;};s.win.emit('online');await tick();assert.equal(retries,1);
 }finally{s.stop();}
});

test('first service worker claim does not reload a first-time visit',async()=>{
 const s=await setup({controlled:false,waiting:false});try{await s.advance();s.changeController();assert.equal(s.reloads,0);assert.equal(s.saves,0);}finally{s.stop();}
});

test('an update activated by another tab waits for this tab to be safe',async()=>{
 const s=await setup({waiting:false});try{
  s.setReady(false);await s.advance();s.changeController();assert.equal(s.reloads,0);
  s.setReady(true);await s.advance();assert.equal(s.reloads,1);
 }finally{s.stop();}
});

test('typing and visible drafts defer updates even after blur until leaving the view',async()=>{
 const s=await setup();try{
  const main=s.document.querySelector('main');main.innerHTML='<textarea id="draft"></textarea>';
  const area=main.querySelector('textarea');area.value='unsaved reasoning';
  area.dispatchEvent(new s.window.Event('input',{bubbles:true}));await s.advance(30000);
  assert.equal(s.messages.length,0,'do not discard a blurred draft');
  main.innerHTML='<p>New view</p>';await s.advance();assert.equal(s.messages.length,1);
 }finally{s.stop();}
});

test('focused controls, dialogs and active practice sessions defer automatic updates',async()=>{
 const s=await setup();try{
  const main=s.document.querySelector('main');main.innerHTML='<input id="editing">';
  Object.defineProperty(s.document,'activeElement',{value:main.querySelector('input'),configurable:true});
  await s.advance();assert.equal(s.messages.length,0);
  Object.defineProperty(s.document,'activeElement',{value:s.document.body,configurable:true});
  main.innerHTML='<dialog open>Account action</dialog>';await s.advance();assert.equal(s.messages.length,0);
  main.innerHTML='<div id="practice-session"><article class="question">Question</article></div>';await s.advance();assert.equal(s.messages.length,0);
  main.innerHTML='';await s.advance();assert.equal(s.messages.length,1);
 }finally{s.stop();}
});

test('downloads automatically, verifies durability before activation and reloads once after control changes',async()=>{
 const s=await setup();try{
  assert.equal(s.updates,1);assert.equal(s.messages.length,0,'quiet period first');
  await s.advance();assert.deepEqual(s.messages,[{type:'SKIP_WAITING'}]);assert.equal(s.saves,1);assert.equal(s.reloads,0);
  s.changeController();assert.equal(s.reloads,1);assert.equal(s.saves,2);
  s.changeController();await s.advance();assert.equal(s.reloads,1);
 }finally{s.stop();}
});

test('unsafe app state and failed local saving defer activation until a later safe check',async()=>{
 const s=await setup();try{
  s.setReady(false);await s.advance();assert.equal(s.messages.length,0);assert.equal(s.saves,0);
  s.setReady(true);s.setSave(false);await s.advance();assert.equal(s.messages.length,0);assert.equal(s.reloads,0);
  s.setSave(true);await s.advance();assert.equal(s.messages.length,1);
 }finally{s.stop();}
});
