import test from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../public/js/storage.js';
const schedule=()=>Array.from({length:11},(_,i)=>({week:i+1,date:i===0?'2026-11-08':null,topic:'Topic '+i,mode:i===0?'LIVE':null,source_status:'user-authored'}));
test('editable schedule is exactly eleven ordered unique weeks with real ISO dates',()=>{
  const rows=schedule(); rows[0].extra='strip';
  assert.equal(store.validateSchedule(rows).length,11); assert.equal(store.validateSchedule(rows)[0].extra,undefined);
  assert.deepEqual(store.validateState({...store.defaultState(),schedule:rows}).schedule,store.validateSchedule(rows));
  for(const bad of [[],rows.slice(1),rows.map(r=>({...r,week:1})),rows.map(r=>({...r,date:'2026-02-30'})),rows.map(r=>({...r,mode:'ZOOM'})),rows.map(r=>({...r,topic:9})),rows.map(r=>({...r,source_status:null}))]) assert.throws(()=>store.validateSchedule(bad));
  assert.equal(store.validateSchedule(schedule().reverse())[0].week,1);
  assert.throws(()=>store.validateState({...store.defaultState(),schedule:[rows[0]]}));
});
test('mission progress, attempts and recall are reconstructed with known fields only',()=>{
  const state=store.defaultState();
  state.missions={'1':{steps:[true,false,true,false],evidence:'my evidence',extra:7}};
  state.attempts=[{questionId:'q1',lessonId:'world-mars',correct:null,score:0.5,timestamp:100,extra:7}];
  state.recall={q1:{due:200,interval:1,repetitions:2,extra:7}};
  const out=store.validateState(state);
  assert.deepEqual(out.missions['1'],{steps:[true,false,true,false],evidence:'my evidence'});
  assert.deepEqual(out.attempts[0],{questionId:'q1',lessonId:'world-mars',correct:null,score:0.5,timestamp:100});
  assert.deepEqual(out.recall.q1,{due:200,interval:1,repetitions:2});
  out.missions['1'].steps[0]=false; assert.equal(state.missions['1'].steps[0],true);
  for(const bad of [{missions:{12:state.missions[1]}},{missions:{'01':state.missions[1]}},{missions:{1:{steps:[1,0,0,0],evidence:''}}},{attempts:[{...state.attempts[0],score:null}]},{attempts:[{...state.attempts[0],correct:'true'}]},{attempts:[{...state.attempts[0],timestamp:-1}]},{recall:{q1:{due:0,interval:-1,repetitions:0}}},{recall:{q1:{due:0,interval:1,repetitions:0.5}}}]) assert.throws(()=>store.validateState({...state,...bad}));
});
test('exam persistence validates bounded IDs, user answers and wall clock fields',()=>{
  const exam={questionIds:['q1','q2'],answers:{q1:1,q2:'written response'},startedAt:1000,endsAt:3001000,submitted:false};
  const state={...store.defaultState(),exam:{...exam,answerKey:'strip'}};
  assert.deepEqual(store.validateState(state).exam,exam);
  for(const change of [{questionIds:['q1','q1']},{questionIds:Array.from({length:21},(_,i)=>'q'+i)},{answers:{q3:1}},{answers:{q1:{correct:true}}},{endsAt:1000},{endsAt:3001001},{startedAt:-1},{submitted:0}]) assert.throws(()=>store.validateState({...state,exam:{...exam,...change}}));
});
test('backup text round-trips and rejects malformed, future and oversized imports',()=>{
  const state=store.defaultState(); state.notes[2]='<script>plain text only</script>';
  assert.deepEqual(store.importState(store.exportState(state)),state);
  for(const bad of ['{', 'null', '{}', JSON.stringify({...state,schemaVersion:99}),' '.repeat(2000001),JSON.stringify({...state,notes:[1,2,3,4]})]) assert.throws(()=>store.importState(bad));
  assert.throws(()=>store.exportState({...state,schemaVersion:0}));
});
function memory() { const data=new Map(); return {data,getItem:k=>data.has(k)?data.get(k):null,setItem:(k,v)=>data.set(k,v)}; }
test('load and save expose errors without deleting corrupt originals or claiming quota success',()=>{
  const storage=memory(),state=store.defaultState(); state.notes[0]='saved';
  assert.deepEqual(store.loadState(storage),{state:store.defaultState(),error:null});
  assert.deepEqual(store.saveState(storage,state),{ok:true,error:null});
  assert.deepEqual(store.loadState(storage),{state,error:null});
  assert.equal(storage.data.size,1); const key=[...storage.data.keys()][0];
  storage.data.set(key,'{corrupt'); const bad=store.loadState(storage);
  assert.deepEqual(bad.state,store.defaultState()); assert.match(bad.error,/JSON|property|position|parse/i); assert.equal(storage.data.get(key),'{corrupt');
  const denied={getItem(){throw new Error('Access denied');},setItem(){throw new Error('Quota exceeded');}};
  assert.match(store.loadState(denied).error,/Access denied/);
  assert.deepEqual(store.saveState(denied,state),{ok:false,error:'Quota exceeded'});
  assert.equal(store.saveState(storage,{...state,schemaVersion:2}).ok,false); assert.equal(storage.data.get(key),'{corrupt');
  assert.equal(store.loadState(null).state.schemaVersion,1); assert.equal(store.saveState(null,state).ok,false);
});
test('validation rejects sparse arrays and executable object properties before touching them',()=>{
  const state=store.defaultState();
  assert.throws(()=>store.validateState({...state,notes:new Array(4)}));
  assert.throws(()=>store.validateState({...state,attempts:new Array(2)}));
  assert.throws(()=>store.validateState({...state,missions:{1:{steps:new Array(4),evidence:''}}}));
  let invoked=false; const hidden=store.defaultState();
  Object.defineProperty(hidden,'toJSON',{value(){invoked=true;return state;}});
  assert.throws(()=>store.validateState(hidden)); assert.equal(invoked,false);
  const accessor=store.defaultState(); Object.defineProperty(accessor,'hidden',{get(){invoked=true;return 1;}});
  assert.throws(()=>store.validateState(accessor)); assert.equal(invoked,false);
  const symbol=store.defaultState(); symbol[Symbol('hidden')]=true; assert.throws(()=>store.validateState(symbol));
});
test('version, note limits, settings and unsafe object structure reject malformed state',()=>{
  const base=store.defaultState();
  for(const value of [null,[],{}, {...base,schemaVersion:2},{...base,schemaVersion:'1'}, {...base,notes:['only one']}, {...base,notes:['x'.repeat(100001),'','','']}, {...base,settings:{theme:'neon'}}, {...base,missions:[]}, JSON.parse('{"__proto__":{}}')]) assert.throws(()=>store.validateState(value));
  const poisoned=JSON.parse(JSON.stringify(base)); poisoned.settings=JSON.parse('{"theme":"dark","constructor":{}}');
  assert.throws(()=>store.validateState(poisoned));
  assert.deepEqual(store.validateState({...base,settings:{theme:'light',junk:1}}).settings,{theme:'light'});
  const circular=store.defaultState(); circular.other=circular; assert.throws(()=>store.validateState(circular));
});
test('default state is fresh, versioned and normalized without unknown fields',()=>{
  const expected={schemaVersion:1,missions:{},schedule:[],notes:['','','',''],attempts:[],recall:{},settings:{theme:'light'},exam:null};
  assert.deepEqual(store.defaultState(),expected);
  const a=store.defaultState(); a.notes[0]='changed'; assert.equal(store.defaultState().notes[0],'');
  const normalized=store.validateState({...expected,unknown:'dropped'});
  assert.deepEqual(normalized,expected); assert.notEqual(normalized.notes,expected.notes);
});
