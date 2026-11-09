import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function setup(client){
 const {mountEntryUI}=await import('../public/js/entry-ui.js');
 const {document,window}=parseHTML('<section id="entry"></section><div id="shell" hidden><main tabindex="-1"></main></div>');
 let guests=0;const identities=[];
 const root=document.querySelector('#entry'),shell=document.querySelector('#shell');
 const ui=mountEntryUI({root,shell,onGuest:()=>{guests++;},onAuthenticated:async id=>{identities.push(id);}});
 if(client)ui.setClient(client);
 for(const input of root.querySelectorAll('input')){input.checkValidity=()=>true;input.reportValidity=()=>{};}
 const email=root.querySelector('[type=email]'),password=root.querySelector('[type=password]');
 return {root,shell,ui,window,email,password,identities,get guests(){return guests;}};
}
test('entry shows login and guest path works before auth is available',async()=>{
 const s=await setup();assert.match(s.root.textContent,/Continue as guest/);assert.equal(s.shell.hidden,true);
 s.root.querySelector('#entry-guest').click();await tick();assert.equal(s.guests,1);assert.equal(s.root.hidden,true);assert.equal(s.shell.hidden,false);
});
test('login uses Supabase and clears password before entering',async()=>{
 const calls=[];const s=await setup({auth:{signInWithPassword:async args=>{calls.push(args);return {data:{session:{user:{id:'student-a'}}},error:null};}}});
 s.email.value='student@example.com';s.password.value='fixture-password';s.root.querySelector('form').dispatchEvent(new s.window.Event('submit',{cancelable:true}));await tick();
 assert.equal(calls.length,1);assert.equal(calls[0].email,'student@example.com');assert.deepEqual(s.identities,['student-a']);assert.equal(s.password.value,'');assert.equal(s.shell.hidden,false);
});
test('Create account opens a signup view without submitting empty login fields',async()=>{
 let calls=0;const s=await setup({auth:{signUp:async()=>{calls++;return {data:{session:null},error:null};}}});
 s.email.checkValidity=()=>false;
 s.root.querySelector('#entry-signup').click();await tick();
 assert.equal(s.root.querySelector('h1').textContent,'Create your account.');
 assert.equal(s.root.querySelector('#entry-signin').textContent,'Create account');
 assert.equal(s.password.getAttribute('autocomplete'),'new-password');assert.equal(calls,0);
 assert.equal(s.root.querySelector('#entry-signup').textContent,'Back to sign in');
 s.password.value='discard-on-back';s.root.querySelector('#entry-signup').click();
 assert.equal(s.root.querySelector('#entry-signin').textContent,'Sign in');assert.equal(s.password.value,'');
 assert.equal(s.password.getAttribute('autocomplete'),'current-password');
});
test('signup view submits to Supabase and awaits email confirmation',async()=>{
 const calls=[];const s=await setup({auth:{signUp:async args=>{calls.push(args);return {data:{session:null},error:null};}}});
 s.root.querySelector('#entry-signup').click();await tick();assert.equal(calls.length,0);
 s.email.value='student@example.com';s.password.value='fixture-password';
 s.root.querySelector('form').dispatchEvent(new s.window.Event('submit',{cancelable:true}));await tick();
 assert.deepEqual(calls,[{email:'student@example.com',password:'fixture-password'}]);assert.equal(s.shell.hidden,true);assert.equal(s.password.value,'');assert.match(s.root.textContent,/confirm.*email|email.*confirm/i);assert.deepEqual(s.identities,[]);
});
test('password reset does not require a password',async()=>{
 let called=false;const s=await setup({auth:{resetPasswordForEmail:async()=>{called=true;return {data:{},error:null};}}});s.email.value='student@example.com';
 s.root.querySelector('#entry-reset').click();await tick();assert.equal(called,true);assert.match(s.root.textContent,/reset link/i);assert.equal(s.shell.hidden,true);
});
test('auth failure remains on login and offers guest without losing work',async()=>{
 const s=await setup({auth:{signInWithPassword:async()=>({data:null,error:Error('Invalid login credentials')})}});s.email.value='student@example.com';s.password.value='fixture-password';
 s.root.querySelector('form').dispatchEvent(new s.window.Event('submit'));await tick();assert.equal(s.password.value,'');assert.equal(s.root.hidden,false);assert.match(s.root.textContent,/Invalid login credentials/);
 s.root.querySelector('#entry-guest').click();await tick();assert.equal(s.guests,1);
});
test('guest choice ignores late login completion',async()=>{
 let resolve;const s=await setup({auth:{signInWithPassword:()=>new Promise(r=>{resolve=r;})}});s.email.value='student@example.com';s.password.value='fixture-password';
 s.root.querySelector('form').dispatchEvent(new s.window.Event('submit'));s.root.querySelector('#entry-guest').click();await tick();
 resolve({data:{session:{user:{id:'late-user'}}},error:null});await tick();assert.deepEqual(s.identities,[]);assert.equal(s.shell.hidden,false);assert.equal(s.password.value,'');
});
test('unavailable auth still allows guest and signout can return to entry',async()=>{
 const s=await setup();s.ui.unavailable();assert.equal(s.root.querySelector('#entry-signin').disabled,true);s.root.querySelector('#entry-guest').click();await tick();
 s.ui.show();assert.equal(s.shell.hidden,true);assert.equal(s.root.hidden,false);assert.equal(s.password.value,'');
});
