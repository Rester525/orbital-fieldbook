import {createAuthActions} from './auth-ui.js';

export function mountEntryUI({root,shell,onGuest,onAuthenticated}) {
  root.innerHTML=`<div class="entry-card">
    <div class="entry-brand"><img src="./assets/icon.svg" width="48" height="48" alt=""><span>Orbital Fieldbook<small>Solar System · Division B</small></span></div>
    <p class="eyebrow">YOUR NEXT DISCOVERY STARTS HERE</p>
    <h1 tabindex="-1">Welcome back.</h1>
    <p id="entry-description" class="muted">Sign in to sync your progress, or explore as a guest.</p>
    <form id="entry-form" novalidate>
      <label for="entry-email">Email</label><input id="entry-email" type="email" autocomplete="email" required placeholder="you@example.com">
      <label for="entry-password">Password</label><input id="entry-password" type="password" autocomplete="current-password" minlength="6" required>
      <button id="entry-signin" type="submit" disabled>Sign in</button>
      <div class="entry-options"><button id="entry-signup" class="secondary" type="button" disabled>Create account</button><button id="entry-reset" class="entry-text-button secondary" type="button" disabled>Forgot password?</button></div>
    </form>
    <p id="entry-status" class="small" role="status" aria-live="polite">Connecting to sign-in… You can continue as a guest now.</p>
    <div class="entry-divider"><span>or</span></div>
    <button id="entry-guest" class="secondary" type="button">Continue as guest</button>
    <p class="entry-footnote small muted">Guest progress stays on this device. Signing in never uploads guest work without your choice.</p>
  </div>`;
  const form=root.querySelector('form'),email=root.querySelector('#entry-email'),password=root.querySelector('#entry-password'),status=root.querySelector('#entry-status');
  const authButtons=[...form.querySelectorAll('button')];
  let actions=null,busy=false,epoch=0,mode='signin';
  function setMode(next){
    if(busy)return;
    mode=next;password.value='';
    const signup=mode==='signup';
    root.querySelector('h1').textContent=signup?'Create your account.':'Welcome back.';
    root.querySelector('#entry-description').textContent=signup?'Save your progress across devices. Enter your email and choose a password of at least 6 characters.':'Sign in to sync your progress, or explore as a guest.';
    root.querySelector('#entry-signin').textContent=signup?'Create account':'Sign in';
    root.querySelector('#entry-signup').textContent=signup?'Back to sign in':'Create account';
    root.querySelector('#entry-reset').hidden=signup;
    password.setAttribute('autocomplete',signup?'new-password':'current-password');
  }
  const controls=()=>{authButtons.forEach(button=>{button.disabled=!actions||busy;});};
  function enter(){epoch++;busy=false;password.value='';root.hidden=true;shell.hidden=false;root.ownerDocument.body?.classList.remove('entry-active');controls();shell.querySelector('main')?.focus?.({preventScroll:true});}
  function show(){epoch++;busy=false;setMode('signin');password.value='';root.hidden=false;shell.hidden=true;root.ownerDocument.body?.classList.add('entry-active');controls();root.querySelector('h1')?.focus?.({preventScroll:true});}
  async function submit(kind){
    if(!actions||busy)return;
    if(!email.checkValidity()){email.reportValidity();return;}
    if(kind!=='reset'&&!password.checkValidity()){password.reportValidity();return;}
    const operation=++epoch;busy=true;controls();status.textContent=kind==='reset'?'Sending reset link…':'Connecting…';
    try{
      if(kind==='reset'){
        await actions.reset(email.value.trim());
        if(operation===epoch)status.textContent='If an account exists, a password reset link has been sent.';
      }else{
        const result=kind==='signup'?await actions.signUp(email.value.trim(),password.value):await actions.signIn(email.value.trim(),password.value);
        if(operation!==epoch)return;
        password.value='';
        if(kind==='signup'&&result.confirmationRequired){status.textContent='Check your email to confirm your account, then sign in.';return;}
        const id=result.session?.user?.id||result.userId;
        if(!id)throw Error('Sign-in did not return an account. Please try again.');
        status.textContent='Opening your fieldbook…';
        await onAuthenticated(id);
        if(operation===epoch)enter();
      }
    }catch(error){if(operation===epoch)status.textContent=error?.message||'Unable to sign in. Try again or continue as a guest.';}
    finally{if(operation===epoch){password.value='';busy=false;controls();}}
  }
  form.addEventListener('submit',event=>{event.preventDefault();submit(mode);});
  root.querySelector('#entry-signup').onclick=()=>{if(busy)return;setMode(mode==='signin'?'signup':'signin');status.textContent=mode==='signup'?'After creating your account, check your email for a confirmation link.':'Sign in or continue as a guest.';root.querySelector('h1')?.focus?.({preventScroll:true});};
  root.querySelector('#entry-reset').onclick=()=>submit('reset');
  root.querySelector('#entry-guest').onclick=async()=>{
    const operation=++epoch;password.value='';busy=false;controls();
    try{await onGuest();if(operation===epoch)enter();}
    catch{if(operation===epoch)status.textContent='Guest mode could not open. Please reload and try again.';}
  };
  show();
  return {enter,show,setClient(client){actions=createAuthActions(client);controls();status.textContent='Sign in or continue as a guest.';},unavailable(){actions=null;controls();status.textContent='Sign-in is unavailable right now. You can still continue as a guest.';}};
}
