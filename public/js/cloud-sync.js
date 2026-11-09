import {STORAGE_KEY,defaultState,exportState,importState,validateState} from './storage.js';

// The legacy key is guest-only. No account state is ever stored in it.
export const accountKey=id=>`${STORAGE_KEY}:user:${id}`;
export const isRelevantStorageKey=(key,id)=>key===(id?accountKey(id):STORAGE_KEY)||Boolean(id&&key===`${accountKey(id)}:dirty`);
const marker=id=>`${accountKey(id)}:dirty`;
const message=e=>e?.message||String(e);
export function createCloudSync({client,storage,onState=()=>{},onStatus=()=>{},backup=()=>{},delay=700}) {
 let user=null,state=defaultState(),revision=0,dirty=false,blocked=false,kind='guest',timer=null,serial=Promise.resolve(),generation=0,version=0;
 const report=(next,detail='')=>{kind=next;onStatus({kind:next,detail,user,dirty});};
 const read=(key)=>{const raw=storage.getItem(key);return raw===null?null:importState(raw);};
 const emit=()=>onState(state);
 const cancel=()=>{clearTimeout(timer);timer=null;};
 const fetchRemote=async id=>{const {data,error}=await client.from('user_fieldbooks').select('state,revision').eq('user_id',id).maybeSingle();if(error)throw error;return data?{state:validateState(data.state),revision:Number(data.revision)}:null;};
 const queue=()=>{cancel();if(user && dirty && !blocked && kind!=='conflict' && kind!=='decision')timer=setTimeout(()=>{retry().catch(e=>report('offline',message(e)));},delay);};
 async function switchUser(id){
  const epoch=++generation;cancel();user=id||null;state=defaultState();revision=0;dirty=false;blocked=false;version=0;emit();
  if(!user){try{state=read(STORAGE_KEY)||defaultState();report('guest');}catch(e){blocked=true;report('corrupt',`Guest data is unreadable: ${message(e)}`);}emit();return;}
  const own=user;report('loading');
  try{
   const raw=storage.getItem(accountKey(own));if(raw!==null)state=importState(raw);
   dirty=storage.getItem(marker(own))==='1';emit();
  }catch(e){if(epoch!==generation)return;blocked=true;report('corrupt',`Account data is unreadable: ${message(e)}. Export the original before recovery.`);return;}
  try{
   const remote=await fetchRemote(own);if(epoch!==generation)return;
   revision=remote?.revision??0;
   if(dirty){report(remote?'conflict':'decision','Unsynced work on this device needs your choice.');return;}
   if(remote){state=remote.state;storage.setItem(accountKey(own),exportState(state));emit();report('synced');return;}
   const guest=read(STORAGE_KEY);report(guest && exportState(guest)!==exportState(defaultState())?'decision':'ready','Cloud has no fieldbook yet. Start empty or explicitly copy guest work.');
  }catch(e){if(epoch!==generation)return;report('offline',`Cloud unavailable: ${message(e)}. Device work remains local.`);}
 }
 function save(next){
  if(blocked){report('corrupt','Unreadable data is protected. Export the original and recover it outside this tab.');return false;}
  try{
   const clean=validateState(next),key=user?accountKey(user):STORAGE_KEY;
   if(user)storage.setItem(marker(user),'1');
   storage.setItem(key,exportState(clean));
   state=clean;version++;dirty=Boolean(user);
   if(user){if(kind!=='conflict')report('pending','Saved on this device; waiting to sync.');queue();}
   else report('guest');
   return true;
  }catch(e){report('offline',`Device save failed: ${message(e)}. Export work before closing.`);return false;}
 }
 async function retry(){
  if(!user||blocked||!dirty||kind==='conflict'||kind==='decision')return false;
  const id=user,epoch=generation;
  cancel();
  const operation=async()=>{
   if(id!==user||epoch!==generation||!dirty||kind==='conflict')return false;
   const snapshot=validateState(state),atVersion=version,expected=revision;
   report('syncing');
   try{
    const {data,error}=await client.rpc('save_fieldbook',{p_user_id:id,p_expected_revision:expected,p_state:snapshot});
    if(id!==user||epoch!==generation)return false;
    if(error){if(/stale|conflict|revision/i.test(message(error))){report('conflict','Cloud changed elsewhere. Choose which copy to keep.');return false;}throw error;}
    const next=typeof data==='number'?data:Number(Array.isArray(data)?data[0]?.save_fieldbook:data?.save_fieldbook??data);
    if(!Number.isSafeInteger(next)||next<=expected)throw Error('Cloud did not return a valid new revision.');
    revision=next;
    if(version!==atVersion){report('pending');queue();return true;}
    storage.removeItem(marker(id));dirty=false;report('synced','Cloud and device match.');return true;
   }catch(e){if(id===user&&epoch===generation)report('offline',`Sync failed: ${message(e)}. Saved on this device; retry when online.`);return false;}
  };
  const result=serial.then(operation,operation);serial=result.then(()=>{},()=>{});return result;
 }
 async function downloadCloud(){
  if(!user||blocked)return false;
  const id=user,epoch=generation,atVersion=version;
  try{
   const remote=await fetchRemote(id);if(id!==user||epoch!==generation)return false;
   if(version!==atVersion){report('conflict','Device work changed during cloud download. Choose a copy again.');return false;}
   // Backup before touching device storage. If backup throws, do not discard work.
   backup(state);const next=remote?.state||defaultState();storage.setItem(accountKey(id),exportState(next));storage.removeItem(marker(id));
   state=next;revision=remote?.revision??0;dirty=false;version++;emit();report('synced','Cloud copy loaded; previous device copy downloaded.');return true;
  }catch(e){if(id===user&&epoch===generation)report('conflict',`Could not load cloud copy: ${message(e)}`);return false;}
 }
 async function overwriteCloud(confirmed=false){
  if(!confirmed||!user||blocked||!dirty||kind!=='conflict'&&kind!=='decision')return false;
  const id=user,epoch=generation,atVersion=version;
  try{
   const remote=await fetchRemote(id);if(id!==user||epoch!==generation)return false;
   if(version!==atVersion){report('conflict','Device work changed after confirmation. Review and confirm again.');return false;}
   revision=remote?.revision??0;report('pending','Confirmed overwrite queued.');return retry();
  }catch(e){if(id===user&&epoch===generation)report('offline',`Cannot refresh cloud revision: ${message(e)}`);return false;}
 }
 async function importGuest(){
  if(!user||blocked||dirty||kind!=='decision')return false;
  try{const guest=read(STORAGE_KEY);if(!guest)return false;if(!save(guest))return false;emit();return retry();}
  catch(e){report('corrupt',`Guest data is unreadable: ${message(e)}`);return false;}
 }
 return {switchUser,save,retry,downloadCloud,overwriteCloud,importGuest,exportUnread(){return blocked&&user?storage.getItem(accountKey(user)):null;},dispose(){generation++;cancel();},get status(){return {kind,dirty,user};},get state(){return state;}};
}
