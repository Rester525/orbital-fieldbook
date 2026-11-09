import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseHTML} from 'linkedom';

test('fresh app boots dashboard and routes to distinct collections, missions and practice',async()=>{
  const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
  globalThis.document=document;globalThis.window=window;
  globalThis.location={hash:'#home',replace(hash){this.hash=hash;}};
  window.scrollTo=()=>{};
  window.HTMLElement.prototype.focus=function(){};
  window.HTMLElement.prototype.scrollIntoView=function(){};
  const saved=new Map();Object.defineProperty(window,'localStorage',{value:{getItem:k=>saved.get(k)??null,setItem:(k,v)=>saved.set(k,v)},configurable:true});
  const oldFetch=globalThis.fetch;
  globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(readFileSync(new URL('../public/'+String(path).replace(/^\.\//,''),import.meta.url),'utf8'))});
  try{
    await import('../public/js/app.js?dashboard-integration');
    await new Promise(resolve=>setTimeout(resolve,30));
    assert.ok(document.querySelector('#entry-form'),'fresh visitors see a login form');
    assert.equal(document.querySelector('.app-shell').hidden,true);
    document.querySelector('#entry-guest').click();await new Promise(resolve=>setImmediate(resolve));
    assert.equal(document.querySelector('.app-shell').hidden,false);
    assert.equal(document.querySelector('#entry-screen').hidden,true);
    const root=document.getElementById('main');assert.ok(root.querySelector('.home-dashboard'),'home must render the study dashboard');
    const route=hash=>{location.hash=hash;window.dispatchEvent(new window.Event('hashchange'));};
    route('#library/world');assert.equal(root.querySelectorAll('.lesson-card').length,9);
    root.querySelector('#library-search').value='Europa';root.querySelector('#library-search').dispatchEvent(new window.Event('input'));
    assert.equal(root.querySelectorAll('.lesson-card').length,1);
    route('#library/mission');assert.equal(root.querySelectorAll('.lesson-card').length,16);assert.equal(root.querySelector('#library-search').value,'');
    route('#missions');assert.equal(root.querySelectorAll('.mission-row').length,11);
    route('#mission/4');assert.ok(root.querySelector('#mission-work'));assert.equal(root.querySelector('a.back').getAttribute('href'),'#missions');
    route('#practice/quick');assert.equal(root.querySelector('#start-five').disabled,false);
    route('#practice/recall');assert.ok(root.querySelector('#reveal-card'));
    route('#practice/simulation');assert.ok(root.querySelector('#start-exam'));assert.equal(root.querySelector('#exam-clock'),null);
    route('#home');assert.ok(root.querySelector('.home-dashboard'));assert.equal(document.querySelectorAll('nav [aria-current="page"]').length,1);
    assert.equal(document.documentElement.dataset.theme,'light');
  }finally{globalThis.fetch=oldFetch;}
});
