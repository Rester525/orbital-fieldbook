export const STORAGE_KEY='orbital-fieldbook-state-v1';
const errorText=error=>error instanceof Error?error.message:String(error);
export function loadState(storage) {
  try {
    const raw=storage.getItem(STORAGE_KEY);
    return {state:raw===null?defaultState():importState(raw),error:null};
  } catch(error) {
    // Never overwrite or remove the original on read failure.
    return {state:defaultState(),error:errorText(error)};
  }
}
export function saveState(storage,state) {
  try { storage.setItem(STORAGE_KEY,exportState(state)); return {ok:true,error:null}; }
  catch(error) { return {ok:false,error:errorText(error)}; }
}
export function exportState(state) { return JSON.stringify(validateState(state)); }
export function importState(raw) {
  text(raw,'Backup',MAX_TEXT);
  return validateState(JSON.parse(raw));
}
export function defaultState() {
  return {schemaVersion:1,missions:{},schedule:[],notes:['','','',''],attempts:[],recall:{},settings:{theme:'light'},exam:null};
}
const MAX_TEXT=2_000_000;
const unsafe=new Set(['__proto__','prototype','constructor']);
function check(ok,message) { if(!ok) throw new TypeError(message); }
function object(value,name) {
  check(value!==null && typeof value==='object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value)),`${name} must be an object`);
}
function text(value,name,max=100000) { check(typeof value==='string' && value.length<=max,`${name} must be text (max ${max})`); return value; }
function safeTree(value,depth=0,seen=new Set(),budget={nodes:0}) {
  check(depth<=12 && ++budget.nodes<=150000,'State is too complex');
  if(value===null || typeof value==='boolean') return;
  if(typeof value==='number') { check(Number.isFinite(value),'Nonfinite value'); return; }
  if(typeof value==='string') { text(value,'value'); return; }
  check(typeof value==='object' && !seen.has(value),'State must be acyclic JSON data');
  const array=Array.isArray(value);
  if(!array) object(value,'value');
  const keys=Reflect.ownKeys(value);
  if(array) check(value.length<=10000 && keys.length===value.length+1,'Sparse or oversized array');
  seen.add(value);
  for(const key of keys) {
    if(array && key==='length') continue;
    check(typeof key==='string' && !unsafe.has(key),'Unsafe object key');
    if(array) check(/^(?:0|[1-9]\d*)$/.test(key) && Number(key)<value.length,'Invalid array property');
    const descriptor=Object.getOwnPropertyDescriptor(value,key);
    check('value' in descriptor,'Accessors not allowed');
    safeTree(descriptor.value,depth+1,seen,budget);
  }
  seen.delete(value);
}
export function validateSchedule(rows) {
  safeTree(rows);
  check(Array.isArray(rows) && rows.length===11,'Schedule must have exactly 11 rows');
  const seen=new Set();
  return rows.map(row=>{
    object(row,'schedule row');
    check(Number.isInteger(row.week) && row.week>=1 && row.week<=11 && !seen.has(row.week),'Invalid or duplicate week');
    seen.add(row.week);
    if(row.date!==null) {
      check(typeof row.date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date),'Use YYYY-MM-DD or null');
      const date=new Date(`${row.date}T00:00:00Z`);
      check(Number.isFinite(date.getTime()) && date.toISOString().slice(0,10)===row.date,'Invalid calendar date');
    }
    check([null,'LIVE','SELF'].includes(row.mode),'Invalid mode');
    return {week:row.week,date:row.date,topic:text(row.topic,'topic',500),mode:row.mode,source_status:text(row.source_status,'source_status',500)};
  }).sort((a,b)=>a.week-b.week);
}
function numeric(value,name,min=0,max=Number.MAX_SAFE_INTEGER,integer=false) {
  check(Number.isFinite(value) && value>=min && value<=max && (!integer || Number.isInteger(value)),`Invalid ${name}`); return value;
}
function id(value) { text(value,'id',120); check(value.length>0 && !unsafe.has(value),'Invalid id'); return value; }
export function validateState(value) {
  safeTree(value); object(value,'state');
  check(JSON.stringify(value).length<=MAX_TEXT,'State too large');
  check(value.schemaVersion===1,'Unsupported schemaVersion (expected 1)');
  const state=defaultState();
  object(value.missions,'missions'); object(value.recall,'recall'); object(value.settings,'settings');
  check(Array.isArray(value.notes) && value.notes.length===4,'Exactly four note faces required');
  state.notes=value.notes.map(v=>text(v,'note'));
  check(['dark','light'].includes(value.settings.theme),'Invalid theme');
  check(Array.isArray(value.schedule),'schedule must be an array');
  state.schedule=value.schedule.length===0?[]:validateSchedule(value.schedule);
  state.settings={theme:value.settings.theme};
  state.missions={};
  for(const [key,mission] of Object.entries(value.missions)) {
    check(/^(?:[1-9]|10|11)$/.test(key),'Unknown mission'); object(mission,'mission');
    check(Array.isArray(mission.steps) && mission.steps.length===4 && mission.steps.every(s=>typeof s==='boolean'),'Four boolean steps required');
    state.missions[key]={steps:[...mission.steps],evidence:text(mission.evidence,'evidence',20000)};
  }
  check(Array.isArray(value.attempts) && value.attempts.length<=10000,'Invalid attempts');
  state.attempts=value.attempts.map(attempt=>{
    object(attempt,'attempt'); check(attempt.correct===null || typeof attempt.correct==='boolean','Invalid correctness');
    return {questionId:id(attempt.questionId),lessonId:id(attempt.lessonId),correct:attempt.correct,score:numeric(attempt.score,'score',0,1),timestamp:numeric(attempt.timestamp,'timestamp')};
  });
  check(Object.keys(value.recall).length<=10000,'Too many recall records'); state.recall={};
  for(const [key,review] of Object.entries(value.recall)) {
    id(key); object(review,'recall');
    state.recall[key]={due:numeric(review.due,'due'),interval:numeric(review.interval,'interval',0,36500),repetitions:numeric(review.repetitions,'repetitions',0,1000000,true)};
  }
  if(value.exam!==null) {
    const exam=value.exam; object(exam,'exam');
    check(Array.isArray(exam.questionIds) && exam.questionIds.length<=20,'Exam has at most 20 questions');
    const questionIds=exam.questionIds.map(id);
    check(new Set(questionIds).size===questionIds.length,'Duplicate exam question');
    numeric(exam.startedAt,'startedAt'); numeric(exam.endsAt,'endsAt');
    check(exam.endsAt-exam.startedAt===3000000,'Exam must last exactly 50 minutes');
    check(typeof exam.submitted==='boolean','Invalid submitted flag');
    object(exam.answers,'exam answers'); const answers={};
    for(const [key,answer] of Object.entries(exam.answers)) {
      check(questionIds.includes(key),'Answer references question outside exam');
      if(typeof answer==='string') text(answer,'written answer',20000);
      else if(answer!==null) numeric(answer,'answer index',0,99,true);
      answers[key]=answer;
    }
    state.exam={questionIds,answers,startedAt:exam.startedAt,endsAt:exam.endsAt,submitted:exam.submitted};
  }
  return state;
}
