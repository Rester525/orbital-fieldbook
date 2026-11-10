const GUEST_UPDATE_KEY='orbital-fieldbook:update-guest';
export function prepareUpdateReload(win,guest){
 try{if(guest){win.sessionStorage.setItem(GUEST_UPDATE_KEY,'1');return win.sessionStorage.getItem(GUEST_UPDATE_KEY)==='1';}win.sessionStorage.removeItem(GUEST_UPDATE_KEY);return true;}catch{return !guest;}
}
export function consumeUpdateGuest(win){
 try{const guest=win.sessionStorage.getItem(GUEST_UPDATE_KEY)==='1';win.sessionStorage.removeItem(GUEST_UPDATE_KEY);return guest;}catch{return false;}
}

// Update only at a quiet, locally saved boundary; never force install-time activation.
export async function startAutoUpdates({serviceWorker,win=window,doc=document,status,button,canReload,verifySaved,reload,now=()=>Date.now()}){
 let disposed=false,reloaded=false,pendingReload=false,sentWorker=null,reg=null,lastActivity=now();
 let controller=serviceWorker?.controller,checking=false;
 const removers=[],timers=[],edited=new Set();
 const editable='input,textarea,select,[contenteditable]:not([contenteditable="false"])';
 const visible=el=>el?.isConnected&&!el.closest('[hidden],dialog:not([open])');
 function editing(){
  for(const el of edited)if(!el.isConnected)edited.delete(el);
  return (visible(doc.activeElement)&&doc.activeElement.matches(editable))||doc.querySelector('dialog[open],#practice-session .question')||[...edited].some(visible)||[...doc.querySelectorAll('#entry-screen input')].some(el=>visible(el)&&el.value);
 }
 const listen=(target,name,fn)=>{target.addEventListener(name,fn);removers.push(()=>target.removeEventListener(name,fn));};
 const stop=()=>{disposed=true;for(const remove of removers)remove();for(const id of timers)win.clearInterval(id);button.onclick=null;};
 if(!serviceWorker){status.textContent='Offline installation unavailable in this browser.';return stop;}
 function attempt(manual=false){
  if(disposed||reloaded||(!pendingReload&&!reg?.waiting))return;
  if((!manual&&now()-lastActivity<10000)||editing()||!canReload()){status.textContent='Update downloaded. It will apply automatically when your work is safe.';return;}
  try{
   if(!verifySaved()){status.textContent='Update waiting for saved work and pending sync to finish.';return;}
   if(pendingReload){reloaded=true;if(reload()===false){reloaded=false;status.textContent='Update waiting until this session can be safely restored.';}return;}
   if(reg.waiting!==sentWorker){reg.waiting.postMessage({type:'SKIP_WAITING'});sentWorker=reg.waiting;status.textContent='Applying downloaded update…';}
  }catch{status.textContent='Update paused. Your current app remains open; it will retry automatically.';}
 }
 for(const event of ['input','change','keydown','pointerdown','scroll','focusin','focusout'])listen(doc,event,e=>{lastActivity=now();if(['input','change'].includes(event)&&e.target?.matches(editable))edited.add(e.target);});
 listen(serviceWorker,'controllerchange',()=>{const previous=controller;controller=serviceWorker.controller;if(!previous||controller===previous)return;pendingReload=true;attempt();});
 try{
  reg=await serviceWorker.register('./sw.js',{updateViaCache:'none'});
  if(disposed)return stop;
  status.textContent=reg.active?'Offline files installed. Updates are automatic.':'Installing offline files…';
  function offer(){if(disposed)return;button.hidden=false;status.textContent='Update downloaded. It will apply automatically when your work is safe.';attempt();}
  function watch(worker){if(!worker)return;listen(worker,'statechange',()=>{if(disposed)return;if(worker.state==='installed'){if(serviceWorker.controller)offer();else status.textContent='Offline files installed. Updates are automatic.';}if(worker.state==='redundant')status.textContent='Update download failed. It will retry automatically.';});}
  async function check(){
   if(disposed||checking||doc.hidden)return;checking=true;
   try{await reg.update();if(!disposed&&reg.waiting)offer();}
   catch{if(!disposed)status.textContent='Update check unavailable. It will retry automatically when online.';}
   finally{checking=false;}
  }
  if(reg.waiting)offer();watch(reg.installing);
  listen(reg,'updatefound',()=>watch(reg.installing));
  listen(win,'online',check);listen(doc,'visibilitychange',()=>{if(!doc.hidden){check();attempt();}});
  button.textContent='Update now';button.onclick=()=>attempt(true);
  timers.push(win.setInterval(attempt,10000),win.setInterval(check,300000));
  await check();
 }catch{status.textContent='Update check unavailable. You can keep using the current app.';}
 return stop;
}
