function check(ok,message) { if(!ok) throw new TypeError(message); }
const DAY=86400000;
function finite(value,min,max) { return Number.isFinite(value) && value>=min && value<=max; }
export function scheduleReview(previous,quality,now=Date.now()) {
  check(Number.isInteger(quality) && quality>=0 && quality<=2,'Quality must be 0, 1 or 2');
  check(finite(now,0,Number.MAX_SAFE_INTEGER-36500*DAY),'Invalid current time');
  if(previous!==null && previous!==undefined) {
    check(typeof previous==='object' && finite(previous.due,0,Number.MAX_SAFE_INTEGER) && finite(previous.interval,0,36500) && Number.isInteger(previous.repetitions) && finite(previous.repetitions,0,1000000),'Invalid previous review');
  }
  const repetitions=quality===0?0:Math.min(1000000,(previous?.repetitions??0)+1);
  let interval=1;
  if(quality===1) interval=Math.max(1,previous?.interval??1);
  if(quality===2 && repetitions>1) interval=repetitions===2?3:Math.max(1,(previous?.interval??1)*2);
  interval=Math.min(36500,interval);
  return {due:now+interval*DAY,interval,repetitions};
}
function validId(id) { return typeof id==='string' && id.length>0 && id.length<=120 && !['__proto__','constructor','prototype'].includes(id); }
function validateBank(questions) {
  check(Array.isArray(questions) && questions.length<=10000,'Question bank must have at most 10000 entries');
  const ids=new Set();
  for(const q of questions) {
    check(q && validId(q.id) && validId(q.lesson_id) && !ids.has(q.id),'Invalid or duplicate question ID'); ids.add(q.id);
  }
}
function shuffled(values) {
  const copy=[...values];
  for(let i=copy.length-1;i>0;i--) {
    const j=Math.floor(Math.random()*(i+1)); [copy[i],copy[j]]=[copy[j],copy[i]];
  }
  return copy;
}
export function selectQuestions(questions,{count=5,lessonIds}={}) {
  validateBank(questions);
  check(Number.isInteger(count) && count>=0 && count<=1000,'Count must be 0..1000');
  check(lessonIds===undefined || (Array.isArray(lessonIds) && lessonIds.length<=10000 && lessonIds.every(validId)),'lessonIds must be an array of IDs');
  const wanted=lessonIds===undefined?null:new Set(lessonIds);
  return shuffled(questions.filter(q=>!wanted || wanted.has(q.lesson_id))).slice(0,count);
}
function category(q) {
  if(q.category==='world' || q.category==='system') return q.category;
  if(/^world[-_]/.test(q.lesson_id)) return 'world';
  if(/^system[-_]/.test(q.lesson_id)) return 'system';
  const refs=Array.isArray(q.rule_refs)?q.rule_refs:[];
  if(refs.some(r=>/^3\.a\.ii(?:$|[.(])/.test(r))) return 'system';
  if(refs.some(r=>/^3\.a\.i(?:$|[.(])/.test(r))) return 'world';
  return 'other';
}
// One per lesson per round; large lessons cannot monopolize the exam.
function balanced(questions) {
  const lessons=new Map();
  for(const q of shuffled(questions)) {
    if(!lessons.has(q.lesson_id)) lessons.set(q.lesson_id,[]);
    lessons.get(q.lesson_id).push(q);
  }
  const groups=[...lessons.values()],result=[];
  for(let i=0;result.length<questions.length;i++) for(const group of groups) if(i<group.length) result.push(group[i]);
  return result;
}
export function createExam(questions,now=Date.now()) {
  validateBank(questions); check(finite(now,0,Number.MAX_SAFE_INTEGER-3000000),'Invalid current time');
  const pools={world:[],system:[],other:[]};
  for(const q of questions) pools[category(q)].push(q);
  for(const key of Object.keys(pools)) pools[key]=balanced(pools[key]);
  const counts={world:0,system:0,other:0},picked=[];
  while(picked.length<20) {
    const before=picked.length;
    for(const key of ['world','other','world','other','system']) {
      if(picked.length===20) break;
      if(counts[key]>=pools[key].length) continue;
      if(key==='system' && pools.world.length>0 && counts.system+1>=counts.world) continue;
      picked.push(pools[key][counts[key]++]);
    }
    if(picked.length===before) break;
  }
  return {questionIds:shuffled(picked).map(q=>q.id),answers:{},startedAt:now,endsAt:now+3000000,submitted:false};
}
export function remainingSeconds(exam,now=Date.now()) {
  check(finite(now,0,Number.MAX_SAFE_INTEGER),'Invalid current time');
  if(exam===null) return 0;
  check(exam && finite(exam.startedAt,0,Number.MAX_SAFE_INTEGER) && finite(exam.endsAt,0,Number.MAX_SAFE_INTEGER) && exam.endsAt-exam.startedAt===3000000 && typeof exam.submitted==='boolean','Invalid exam clock');
  if(exam.submitted) return 0;
  return Math.max(0,Math.min(3000,Math.ceil((exam.endsAt-now)/1000)));
}
export function gradeQuestion(question,answer) {
  check(question && ['mcq','written'].includes(question.type),'Unsupported question type');
  check(typeof question.explanation==='string','Explanation must be text');
  if(question.type==='written') {
    check(Array.isArray(question.rubric) && question.rubric.every(r=>typeof r==='string'),'Written rubric required');
    return {correct:null,score:null,explanation:question.explanation,rubric:[...question.rubric]};
  }
  check(Array.isArray(question.options) && question.options.length>=2 && question.options.every(o=>typeof o==='string'),'Invalid options');
  check(Number.isInteger(question.answer) && question.answer>=0 && question.answer<question.options.length,'Invalid answer key');
  check(answer===null || answer===undefined || (Number.isInteger(answer) && answer>=0 && answer<question.options.length),'Answer must be an option index');
  const correct=answer===question.answer;
  return {correct,score:correct?1:0,explanation:question.explanation??''};
}
