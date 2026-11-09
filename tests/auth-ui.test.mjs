import test from 'node:test';
import assert from 'node:assert/strict';
import {authHTML,createAuthActions,mountAuthUI} from '../public/js/auth-ui.js';
import {parseHTML} from 'linkedom';

test('account dialog offers labeled email/password login, signup, reset and sync controls',()=>{
 const html=authHTML();for(const word of ['type="email"','type="password"','Sign in','Create account','Reset password','Sign out','Retry sync','Use cloud copy','Keep device copy'])assert.ok(html.includes(word),word);
 assert.match(html,/aria-live="polite"/);
});
test('account dialog has a dedicated mentor activation section inside signed-in controls',()=>{
 const {document}=parseHTML(authHTML());
 assert.ok(document.querySelector('#account-signed-in #mentor-access'),'signed-in-only mentor section');
});
test('mentor activation works inside the account dialog and clears on close/signout',async()=>{
 const calls=[];let active=false;
 const client={auth:{},rpc:async(name,args)=>{
  calls.push({name,args});
  if(name==='redeem_mentor_code'){active=true;return {data:{ok:true},error:null};}
  return {data:{is_mentor:active},error:null};
 }};
 const {document}=parseHTML('<button id="entry"></button><dialog id="dialog"></dialog>');
 const dialog=document.querySelector('#dialog');dialog.close=()=>{};
 const ui=mountAuthUI({client,sync:{status:{kind:'synced',user:'test-account',dirty:false}},button:document.querySelector('#entry'),dialog});
 await new Promise(resolve=>setImmediate(resolve));
 const input=dialog.querySelector('#mentor-access input');input.value='test-only-placeholder';
 dialog.querySelector('[data-mentor-action="activate"]').click();
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(calls.map(c=>c.name),['mentor_access_status','redeem_mentor_code','mentor_access_status']);
 assert.equal(input.value,'');assert.match(dialog.querySelector('#mentor-access').textContent,/Mentor access active/);
 input.value='temporary draft';dialog.querySelector('[data-account-action="close"]').click();assert.equal(input.value,'');
 ui.update({kind:'guest',user:null,dirty:false});assert.equal(dialog.querySelector('#account-signed-in').hidden,true);
 assert.ok(!dialog.querySelector('#mentor-access').textContent.includes('Mentor access active'));
});
test('first account with guest work offers explicit start-empty or copy guest choices',()=>{
 const {document}=parseHTML('<button id="entry"></button><dialog id="dialog"></dialog>');
 const sync={status:{kind:'guest',user:null,dirty:false}};
 const ui=mountAuthUI({client:{auth:{}},sync,button:document.querySelector('#entry'),dialog:document.querySelector('#dialog')});
 ui.update({kind:'decision',user:'a',dirty:false});
 assert.equal(document.querySelector('[data-account-action="guest"]').hidden,false);
 assert.match(document.querySelector('[data-account-action="cloud"]').textContent,/Start empty/);
 assert.equal(document.querySelector('[data-account-action="overwrite"]').hidden,true);
 ui.update({kind:'decision',user:'a',dirty:true});
 assert.equal(document.querySelector('[data-account-action="guest"]').hidden,true,'guest import must not replace unsynced account work');
});
test('password recovery exposes a new-password action and updates the signed-in user',async()=>{
 const calls=[];const client={auth:{updateUser:async data=>{calls.push(data);return {data:{user:{id:'a'}},error:null};}}};
 const actions=createAuthActions(client);await actions.updatePassword('new-secret-pass');assert.deepEqual(calls,[{password:'new-secret-pass'}]);
 const {document}=parseHTML('<button id="entry"></button><dialog id="dialog"></dialog>');
 const ui=mountAuthUI({client,sync:{status:{kind:'guest',user:null,dirty:false}},button:document.querySelector('#entry'),dialog:document.querySelector('#dialog')});
 ui.setRecoveryMode(true);
 assert.equal(document.querySelector('#account-recovery').hidden,false);
 assert.equal(document.querySelector('#account-credentials').hidden,true);
 assert.match(document.querySelector('#account-recovery').textContent,/new password/i);
});

test('unread account storage has an export action rather than a false backup',()=>{
 const {document}=parseHTML('<button id="entry"></button><dialog id="dialog"></dialog>');
 const ui=mountAuthUI({client:{auth:{}},sync:{status:{kind:'guest',user:null,dirty:false},exportUnread(){return true;}},button:document.querySelector('#entry'),dialog:document.querySelector('#dialog')});
 ui.update({kind:'corrupt',user:'a',dirty:false});
 assert.equal(document.querySelector('[data-account-action="export-unread"]').hidden,false);
});

test('auth actions use injected Supabase client and distinguish confirmation from session',async()=>{
 const calls=[];const client={auth:{signUp:async args=>{calls.push(['signup',args]);return {data:{user:{id:'a'},session:null},error:null};},signInWithPassword:async args=>{calls.push(['login',args]);return {data:{session:{user:{id:'a'}}},error:null};},resetPasswordForEmail:async email=>{calls.push(['reset',email]);return {data:{},error:null};},signOut:async()=>{calls.push(['logout']);return {error:null};}}};
 const actions=createAuthActions(client);assert.equal((await actions.signUp('a@example.com','example-secret')).confirmationRequired,true);
 await actions.signIn('a@example.com','example-secret');await actions.reset('a@example.com');await actions.signOut();
 assert.deepEqual(calls.map(x=>x[0]),['signup','login','reset','logout']);
 assert.equal(calls[0][1].email,'a@example.com');
});
