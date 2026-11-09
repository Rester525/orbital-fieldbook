import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {renderPractice} from '../public/js/practice-ui.js';
import {defaultState} from '../public/js/storage.js';
const q={id:'q-demo',lesson_id:'demo',rule_refs:['3.a.i'],type:'mcq',kind:'reasoning',prompt:'Which statement follows?',options:['A','B','C'],answer:0,explanation:'A follows from the evidence.',source_refs:[]};
function setup(){
  const {document,window}=parseHTML('<html><body><div id="notice"></div><main></main></body></html>');
  globalThis.document=document;globalThis.window=window;
  window.HTMLElement.prototype.scrollIntoView=function(){};
  window.HTMLElement.prototype.focus=function(){};
  return document.querySelector('main');
}
for(const mode of ['quick','recall','simulation','due'])test(`${mode} shortcut opens its own practice view without starting a timer`,()=>{
  const root=setup(),state=defaultState();
  const cleanup=renderPractice(root,{questions:[q],lessons:[]},state,()=>true,mode);
  assert.equal(state.exam,null);
  if(mode==='quick'){assert.ok(root.querySelector('#start-five'));assert.equal(root.querySelector('#start-five').disabled,false);assert.equal(root.querySelector('#start-exam').closest('section').hidden,true);root.querySelector('#start-five').click();assert.ok(root.querySelector('[data-question="q-demo"]'));}
  if(mode==='recall'){assert.ok(root.querySelector('#reveal-card'));assert.equal(root.querySelector('#card-answer').hidden,true);}
  if(mode==='simulation'){assert.ok(root.querySelector('#start-exam'));assert.equal(root.querySelector('#start-five').closest('section').hidden,true);assert.match(root.querySelector('h1').textContent,/simulation/i);}
  if(mode==='due'){assert.match(root.querySelector('#practice-session').textContent,/Nothing due/i);}
  cleanup();
});
