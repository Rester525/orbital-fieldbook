import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {libraryHTML,bindLibrary} from '../public/js/library-ui.js';
import {readFileSync} from 'node:fs';
import {defaultState,importState,exportState} from '../public/js/storage.js';
test('new users start light while existing dark saves are preserved',()=>{
  assert.equal(defaultState().settings.theme,'light');
  const dark=defaultState();dark.settings.theme='dark';
  assert.equal(importState(exportState(dark)).settings.theme,'dark');
});
test('shell provides grouped learning routes and mobile disclosure',()=>{
  const {document}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
  for(const route of ['missions','library/foundation','library/world','library/system','library/mission','library/method','library/math','practice/quick','practice/recall','practice/simulation']) assert.ok(document.querySelector(`nav a[href="#${route}"]`),route);
  const toggle=document.querySelector('#menu-toggle');assert.ok(toggle);
  assert.equal(toggle.getAttribute('aria-expanded'),'false');
  assert.ok(document.getElementById(toggle.getAttribute('aria-controls')));
});
test('mobile menu toggles, Escape restores focus, and route selection is exact',async()=>{
  const {bindNavigation,updateNavigation}=await import('../public/js/navigation-ui.js');
  const {document,window}=parseHTML(readFileSync(new URL('../public/index.html',import.meta.url),'utf8'));
  const toggle=document.querySelector('#menu-toggle');
  toggle.focus=()=>toggle.setAttribute('data-focused','true');
  const close=bindNavigation(document);toggle.click();
  assert.equal(toggle.getAttribute('aria-expanded'),'true');
  assert.equal(document.body.classList.contains('menu-open'),true);
  const escape=new window.Event('keydown');escape.key='Escape';document.dispatchEvent(escape);
  assert.equal(toggle.getAttribute('aria-expanded'),'false');assert.equal(toggle.dataset.focused,'true');
  toggle.click();document.querySelector('nav a[href="#library/world"]').click();
  assert.equal(toggle.getAttribute('aria-expanded'),'false');
  updateNavigation(document,'lesson','europa',lessons);
  assert.equal(document.querySelectorAll('nav [aria-current="page"]').length,1);
  assert.equal(document.querySelector('nav [aria-current="page"]').getAttribute('href'),'#library/world');
  updateNavigation(document,'mission','4',lessons);
  assert.equal(document.querySelector('nav [aria-current="page"]').getAttribute('href'),'#missions');
  updateNavigation(document,'practice','quick',lessons);
  assert.equal(document.querySelector('nav [aria-current="page"]').getAttribute('href'),'#practice/quick');
  close();
});
const lessons=[{id:'europa',title:'Europa',category:'world',summary:'An icy moon',rule_refs:['3.a']},{id:'transits',title:'Transits',category:'method',summary:'A periodic dip',rule_refs:['3.b']}];
test('collection deep links filter immediately, then allow changing collection and search',()=>{
  const {document,window}=parseHTML('<main></main>');
  const root=document.querySelector('main');
  root.innerHTML=libraryHTML(lessons,'world');
  bindLibrary(root,lessons,'world');
  assert.equal(root.querySelectorAll('.lesson-card').length,1);
  assert.match(root.querySelector('.lesson-card').textContent,/Europa/);
  const category=root.querySelector('#library-category');
  // LinkeDOM implements select.value as a getter only: set the actual option.
  for(const option of category.querySelectorAll('option')) option.removeAttribute('selected');
  category.querySelector('[value="method"]').setAttribute('selected','');
  category.dispatchEvent(new window.Event('change'));
  assert.match(root.querySelector('.lesson-card').textContent,/Transits/);
  const input=root.querySelector('#library-search');input.value='not-found';input.dispatchEvent(new window.Event('input'));
  assert.equal(root.querySelectorAll('.lesson-card').length,0);
  assert.match(root.querySelector('#library-count').textContent,/0 lessons/);
});
