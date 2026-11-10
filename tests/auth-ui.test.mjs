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
test('owner mentor access appears automatically and clears on signout',async()=>{
 const calls=[];const active=true;
 const client={auth:{},rpc:async(name,args)=>{
  calls.push({name,args});
  return {data:{is_mentor:active},error:null};
 }};
 const {document}=parseHTML('<button id="entry"></button><dialog id="dialog"></dialog>');
 const dialog=document.querySelector('#dialog');dialog.close=()=>{};
 const ui=mountAuthUI({client,sync:{status:{kind:'synced',user:'test-account',dirty:false}},button:document.querySelector('#entry'),dialog});
 await new Promise(resolve=>setImmediate(resolve));
 assert.deepEqual(calls.map(c=>c.name),['mentor_access_status']);
 assert.ok(!dialog.querySelector('#mentor-access input'));
 assert.match(dialog.querySelector('#mentor-access').textContent,/Mentor access active/);
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
 const actions=createAuthActions(client);assert.equal((await actions.signUp('a@example.com','example-secret','Alex Rivera')).confirmationRequired,true);
 await actions.signIn('a@example.com','example-secret');await actions.reset('a@example.com');await actions.signOut();
 assert.deepEqual(calls.map(x=>x[0]),['signup','login','reset','logout']);
 assert.equal(calls[0][1].email,'a@example.com');
});

test('signup rejects empty or oversized names before contacting auth',async()=>{
 let calls=0;const actions=createAuthActions({auth:{signUp:async()=>{calls++;return {data:{session:null}};}}});
 for(const name of [undefined,null,'','   ','a'.repeat(81)])await assert.rejects(actions.signUp('a@example.com','example-secret',name),/name.*1.*80/i);
 assert.equal(calls,0);
});

test('account dialog Create account opens signup without validating login fields',async()=>{
 const {document,window}=parseHTML('<button id=entry></button><dialog id=dialog></dialog>');
 const dialog=document.querySelector('#dialog');let opened=0;
 mountAuthUI({client:{auth:{}},sync:{status:{kind:'guest',user:null,dirty:false}},button:document.querySelector('#entry'),dialog,onCreateAccount:()=>{opened++;}});
 const form=dialog.querySelector('form');form.elements={email:form.querySelector('#account-email'),password:form.querySelector('#account-password')};
 form.elements.email.checkValidity=()=>false;form.elements.email.reportValidity=()=>{};
 dialog.querySelector('[data-account-action=signup]').dispatchEvent(new window.Event('click',{bubbles:true}));
 await new Promise(resolve=>setImmediate(resolve));assert.equal(opened,1);
});
