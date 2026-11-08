export function createAuthActions(client){
 const check=({data,error})=>{if(error)throw error;return data;};
 return {
  async signIn(email,password){return check(await client.auth.signInWithPassword({email,password}));},
  async signUp(email,password){const data=check(await client.auth.signUp({email,password}));return {confirmationRequired:!data.session};},
  async reset(email){return check(await client.auth.resetPasswordForEmail(email));},
  async updatePassword(password){return check(await client.auth.updateUser({password}));},
  async signOut(){return check(await client.auth.signOut());}
 };
}
export function authHTML(){return `<form id="account-form" method="dialog" novalidate>
 <h2 id="account-title">Fieldbook account</h2><p>Guest work stays on this device. Signing in never copies it to an account without your choice.</p>
 <p id="account-identity" class="small"></p><p id="account-status" role="status" aria-live="polite"></p>
 <div id="account-credentials"><label for="account-email">Email</label><input id="account-email" name="email" type="email" autocomplete="email" required>
 <label for="account-password">Password</label><input id="account-password" name="password" type="password" autocomplete="current-password" minlength="6" required>
 <div class="actions"><button type="button" data-account-action="signin">Sign in</button><button type="button" class="secondary" data-account-action="signup">Create account</button><button type="button" class="secondary" data-account-action="reset">Reset password</button></div></div>
 <div id="account-recovery" hidden><p>Set a new password for this account.</p><label for="account-new-password">New password</label><input id="account-new-password" type="password" autocomplete="new-password" minlength="8" required><button type="button" data-account-action="update-password">Save new password</button></div>
 <div id="account-signed-in" hidden><p>Changes save here first, then sync to your private account when online.</p><div class="actions"><button type="button" data-account-action="retry">Retry sync</button><button type="button" class="secondary" data-account-action="guest">Copy guest work to account</button><button type="button" class="secondary" data-account-action="cloud">Use cloud copy</button><button type="button" class="secondary" data-account-action="overwrite">Keep device copy (overwrite cloud)</button><button type="button" class="secondary" data-account-action="export-unread" hidden>Export unread account data</button><button type="button" class="secondary" data-account-action="signout">Sign out</button></div></div>
 <div class="actions"><button type="button" class="secondary" data-account-action="close">Close</button></div></form>`;}
export function mountAuthUI({client,sync,button,dialog,canSwitch=()=>true,exportRaw=()=>{}}){
 const actions=createAuthActions(client);dialog.innerHTML=authHTML();let recoveryMode=false;
 const form=dialog.querySelector('#account-form'),status=dialog.querySelector('#account-status'),identity=dialog.querySelector('#account-identity');
 const text=s=>{status.textContent=s;button.title=s;};
 const labels={loading:'Checking account…',guest:'Guest · saved on this device',ready:'No cloud fieldbook yet. Start here or copy guest work.',decision:'Choose whether to copy guest work or keep device work; no automatic upload.',pending:'Saved on this device · waiting to sync',syncing:'Syncing…',synced:'Saved here and in your account',offline:'Saved on this device · cloud unavailable. Retry sync when online.',conflict:'Sync conflict: cloud and device differ. Choose a copy below.',corrupt:'Unreadable stored work is protected. Export the original before recovery.'};
 function update(s){
  const signed=Boolean(s.user);button.textContent=signed?'Account & sync':'Sign in · sync';identity.textContent=signed?'Signed in · private fieldbook':'Using this device as a guest';
  dialog.querySelector('#account-credentials').hidden=signed||recoveryMode;
  dialog.querySelector('#account-recovery').hidden=!recoveryMode;
  dialog.querySelector('#account-signed-in').hidden=!signed||recoveryMode;
  const choice=s.kind==='conflict'||s.kind==='decision';
  form.querySelector('[data-account-action="guest"]').hidden=s.kind!=='decision'||s.dirty;
  form.querySelector('[data-account-action="cloud"]').hidden=!choice;
  form.querySelector('[data-account-action="cloud"]').textContent=s.kind==='decision'?'Start empty (keep guest separate)':'Use cloud copy';
  form.querySelector('[data-account-action="overwrite"]').hidden=!choice||!s.dirty;
  form.querySelector('[data-account-action="retry"]').hidden=!s.dirty||choice;
  form.querySelector('[data-account-action="export-unread"]').hidden=s.kind!=='corrupt';
  text(s.detail||labels[s.kind]||'Account ready.');
 }
 button.onclick=()=>{if(!canSwitch())return;dialog.showModal();dialog.querySelector(recoveryMode?'#account-new-password':'#account-email')?.focus();};
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('click',async e=>{
  const name=e.target.closest('[data-account-action]')?.dataset.accountAction;if(!name)return;
  if(name==='close'){dialog.close();return;}if(!canSwitch())return;
  const email=form.elements.email.value.trim(),password=form.elements.password.value;
  if(['signin','signup','reset'].includes(name)&&!form.elements.email.checkValidity()){form.elements.email.reportValidity();return;}
  if(['signin','signup'].includes(name)&&!form.elements.password.checkValidity()){form.elements.password.reportValidity();return;}
  if(name==='overwrite'&&!confirm('Replace the current cloud fieldbook with this device’s copy? Other devices may have newer work.'))return;
  if(name==='cloud'&&!confirm(sync.status.kind==='decision'?'Start with an empty account fieldbook? Your guest work stays separate, and any account device work downloads as a backup first.':'Download the cloud copy? Your current device copy will download as a backup first.'))return;
  if(name==='guest'&&!confirm('Copy guest work into this account? The guest copy stays on this device.'))return;
  const control=e.target;control.disabled=true;
  try{
   if(name==='signin'){await actions.signIn(email,password);form.elements.password.value='';text('Signed in. Loading your private fieldbook…');}
   if(name==='signup'){const result=await actions.signUp(email,password);form.elements.password.value='';text(result.confirmationRequired?'Check your email to confirm the account, then sign in. No fieldbook was uploaded.':'Account created. Loading your fieldbook…');}
   if(name==='reset'){await actions.reset(email);text('If this email has an account, a password reset link has been sent.');}
   if(name==='update-password'){
    const input=form.querySelector('#account-new-password');
    if(!input.checkValidity()){input.reportValidity();return;}
    await actions.updatePassword(input.value);input.value='';recoveryMode=false;update(sync.status);text('Password changed. Your fieldbook is ready.');
   }
   if(name==='export-unread'){const raw=sync.exportUnread();if(raw!==null)exportRaw(raw);text('Unread account data exported. The saved original has not been changed.');}
   if(name==='signout'){await actions.signOut();text('Signed out. Guest fieldbook restored.');}
   if(name==='retry')await sync.retry();
   if(name==='cloud')await sync.downloadCloud();
   if(name==='overwrite')await sync.overwriteCloud(true);
   if(name==='guest')await sync.importGuest();
  }catch(err){form.elements.password.value='';text(`Account action failed: ${err.message||String(err)}`);}
  finally{control.disabled=false;}
 });
 update(sync.status);return {update,setRecoveryMode(enabled){recoveryMode=enabled;update(sync.status);if(enabled){text('Set a new password to finish account recovery.');if(!dialog.open)dialog.showModal?.();dialog.querySelector('#account-new-password')?.focus?.();}}};
}
