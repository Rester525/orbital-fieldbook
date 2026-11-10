import test from 'node:test';
import assert from 'node:assert/strict';
import * as updates from '../public/js/auto-update.js';

test('automatic reload guest choice is stored once and consumed on the next boot',()=>{
 assert.equal(typeof updates.prepareUpdateReload,'function');assert.equal(typeof updates.consumeUpdateGuest,'function');
 const values=new Map();const win={sessionStorage:{setItem:(k,v)=>values.set(k,v),getItem:k=>values.get(k)??null,removeItem:k=>values.delete(k)}};
 assert.equal(updates.prepareUpdateReload(win,true),true);assert.equal(values.size,1);
 assert.equal(updates.consumeUpdateGuest(win),true);assert.equal(values.size,0);assert.equal(updates.consumeUpdateGuest(win),false);
 updates.prepareUpdateReload(win,true);updates.prepareUpdateReload(win,false);assert.equal(updates.consumeUpdateGuest(win),false);
});
test('blocked session storage defers guest update rather than restoring a saved login',()=>{
 assert.equal(typeof updates.prepareUpdateReload,'function');
 const win={get sessionStorage(){throw Error('blocked');}};
 assert.equal(updates.prepareUpdateReload(win,true),false);assert.equal(updates.consumeUpdateGuest(win),false);
 assert.equal(updates.prepareUpdateReload(win,false),true);
});
