import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
const file = name => new URL(`../public/data/${name}.json`, import.meta.url);
const required = ['1','2.a–c','3 intro','3.b.i','3.b.ii','3.b.iii','3.b.iv','3.b.vi(1)','3.b.vi(2)','3.b.vi(3)','4.a–c'];
const load = name => JSON.parse(readFileSync(file(name), 'utf8'));
// Tiny arithmetic parser: no eval, Function, names, properties, calls or JS source.
function arithmetic(expression) {
  assert.equal(typeof expression, 'string');
  assert.ok(expression.length <= 300);
  assert.match(expression, /^[0-9.\s+*/()\-]+$/);
  const tokens = expression.match(/(?:\d+(?:\.\d*)?|\.\d+)|\*\*|[+*/()\-]/g) || [];
  assert.equal(tokens.join(''), expression.replace(/\s/g,''));
  let pos = 0;
  function atom() {
    const t = tokens[pos++];
    if(t === '(') { const v = sum(); assert.equal(tokens[pos++], ')'); return v; }
    assert.match(t || '', /^(?:\d+(?:\.\d*)?|\.\d+)$/); return Number(t);
  }
  function power() { const a = atom(); if(tokens[pos] === '**') { pos++; return a ** unary(); } return a; }
  function unary() { if(tokens[pos] === '+') {pos++;return unary();} if(tokens[pos] === '-') {pos++;return -unary();} return power(); }
  function product() { let v = unary(); while(['*','/'].includes(tokens[pos])) { const op=tokens[pos++], n=unary(); v=op==='*'?v*n:v/n; } return v; }
  function sum() { let v=product(); while(['+','-'].includes(tokens[pos])) {const op=tokens[pos++],n=product();v=op==='+'?v+n:v-n;} return v; }
  const value = sum(); assert.equal(pos,tokens.length); assert.ok(Number.isFinite(value)); return value;
}
test('numeric checker permits arithmetic only and respects precedence', () => {
  assert.equal(arithmetic('2 + 3 * 4'),14); assert.equal(arithmetic('(2 + 3) ** 2'),25);
  assert.equal(arithmetic('2 ** 3 ** 2'),512); assert.equal(arithmetic('-2 ** 2'),-4);
  for(const x of ['process.exit()', 'Math.sqrt(4)','globalThis','1;2','1e3','1/0','1 2','(2','2..3','']) assert.throws(()=>arithmetic(x),x);
});
test('original question bank covers clauses, methods, numeric answers and meaningful rubrics', () => {
  assert.ok(existsSync(file('questions-foundations')), 'authored question dataset must exist');
  const qs=load('questions-foundations'), lessons=load('foundations');
  const byId=new Map(lessons.map(l=>[l.id,l]));
  assert.ok(qs.length >= 25);
  assert.equal(new Set(qs.map(q=>q.id)).size,qs.length);
  assert.ok(qs.filter(q=>q.type==='written').length>=10);
  assert.ok(qs.filter(q=>q.type==='mcq').length>=10);
  assert.ok(qs.filter(q=>q.numeric_check).length>=12);
  for(const ref of required) assert.ok(qs.some(q=>q.rule_refs.includes(ref)),`unassessed ${ref}`);
  for(const l of lessons) assert.ok(qs.some(q=>q.lesson_id===l.id),`no practice for ${l.id}`);
  for(const l of lessons.filter(l=>l.category==='method')) assert.ok(qs.some(q=>q.lesson_id===l.id && q.kind==='data' && q.data?.rows.length>=3),`missing data exercise: ${l.title}`);
  for(const q of qs) {
    const lesson=byId.get(q.lesson_id); assert.ok(lesson, q.id);
    assert.ok(q.rule_refs.length); for(const ref of q.rule_refs) assert.ok(lesson.rule_refs.includes(ref));
    assert.ok(['recall','comparison','data','reasoning','math'].includes(q.kind));
    assert.ok(q.difficulty); assert.ok(q.prompt.length>35); assert.ok(q.explanation.length>60);
    assert.ok(q.source_refs.length);
    for(const s of q.source_refs) {
      assert.match(s.url,/^https:\/\//); assert.ok(s.title && s.locator && s.status); assert.equal(s.checked_at,'2026-11-08');
    }
    if(q.type==='mcq') {
      assert.ok(q.options.length>=3); assert.equal(new Set(q.options).size,q.options.length);
      assert.ok(Number.isInteger(q.answer) && q.answer>=0 && q.answer<q.options.length);
      assert.ok(q.options.every(x=>typeof x==='string' && x.trim()));
    } else {
      assert.equal(q.type,'written'); assert.ok(q.rubric.length>=2);
      assert.ok(q.rubric.every(x=>typeof x==='string' && x.length>25));
      assert.equal(q.answer,undefined);
    }
    if(q.numeric_check) {
      const actual=arithmetic(q.numeric_check.expression);
      assert.equal(typeof q.numeric_check.expected,'number');
      assert.ok(Math.abs(actual-q.numeric_check.expected)<=1e-9*Math.max(1,Math.abs(actual)),`${q.id}: ${actual} vs ${q.numeric_check.expected}`);
      assert.ok(q.explanation.replaceAll('−','-').includes(String(q.numeric_check.expected)), `${q.id}: numeric key must appear in explanation`);
    }
    if(q.data) {
      assert.ok(q.data.headers.length>=2); assert.ok(q.data.headers.every(x=>typeof x==='string'));
      assert.ok(q.data.rows.length>=3);
      for(const row of q.data.rows) {assert.equal(row.length,q.data.headers.length);assert.ok(row.every(x=>typeof x==='string'||typeof x==='number'));}
    }
    if(q.diagram) assert.ok(['spectrum','morphology'].includes(q.diagram));
    assert.doesNotMatch(JSON.stringify(q),/<(?:script|iframe|img|svg)|javascript:/i);
  }
});
test('independent answer-key reasoning anchors and data calculations agree', () => {
  const qs=new Map(load('questions-foundations').map(q=>[q.id,q]));
  // Author-reviewed scientific conclusions: these are not derived from answer indexes.
  const correct={
    materials:'Two double-sided sheets prepared as required, writing utensils and no calculator',
    'scope-review':'A manual mapping exists, but current official updates still need checking',
    conditions:'B, because liquid persistence and energy are both supported',
    'disequilibrium-life':'A source or slow process may sustain disequilibrium; biology is one hypothesis',
    spectrum:'X is favored, but model limitations still require checking',
    nucleobase:'A chemical building block has been found; its presence alone does not establish life',
    'ice-warming':'Solid ice crystallized, altering how trapped material was stored',
    'brine-threshold':'Row 2',
    'chemo-label':'Chemolithoautotroph; energy and carbon sources are separate traits',
    'transit-no-dip':'Orbital alignment, coverage and sensitivity limit which planets can be found',
    'rv-shift':'3 km/s receding',
    'microlensing-period':'The short duration describes the anomaly, not directly the planet’s orbital period',
    'imaging-table':'B only',
    'inverse-square':'80 W/m²',stefan:'81','equilibrium-scale':'120 K',
    'gravity-force':'0.25 F','kepler-period':'27 years',escape:'6 m/s',
    'gas-pressure':'120 kPa','arrhenius-factor':'12 s⁻¹',
    catalyst:'Forward and reverse processes can speed up, but K is unchanged'
  };
  assert.equal(Object.keys(correct).length,[...qs.values()].filter(q=>q.type==='mcq').length);
  for(const [id,text] of Object.entries(correct)) {const q=qs.get('qf-'+id);assert.equal(q.options[q.answer],text,id);}
  const transit=qs.get('qf-transit-table');
  assert.ok(Math.abs((1-transit.data.rows[0][2]/1000)**0.5-0.2)<1e-12);
  assert.equal(transit.data.rows[1][1]-transit.data.rows[0][1],6);
  const rv=qs.get('qf-rv-table').data.rows.map(r=>r[1]);
  assert.equal((Math.max(...rv)-Math.min(...rv))/2,6);
  assert.equal(Math.max(...qs.get('qf-microlensing-table').data.rows.map(r=>r[2]-r[1])),0.5);
  assert.deepEqual(qs.get('qf-imaging-table').data.rows.filter(r=>r[1]>=0.25&&r[2]>=0.00002).map(r=>r[0]),['B']);
  for(const id of ['morphology','delivery','survival','imaging-followup','rates-vs-equilibrium']) {
    const q=qs.get('qf-'+id); assert.ok(q.rubric.some(r=>/not|without|distinguish|avoid|reject|competing|artifact|false|alternative/i.test(r)),id);
  }
});
test('lesson worked arithmetic is independently recomputed', () => {
  const checks=[
    ['12/3',4],['(1000-990)/1000',0.01],['0.01**0.5',0.1],['8-2',6],
    ['300000*0.01/500',6],['(4-(-4))/2',4],['(2.4-2.0)/2.0',0.2],
    ['300000*0.006/600',3],['900/(3**2)',100],['800*(1-0.25)',600],['800*(1-0.25)/4',150],
    ['2**4',16],['2900/10',290],['(1/16)**0.25',0.5],['(0.4/0.8)**0.25',0.8408964152537145],
    ['-24*2/6',-8],['2*(2**2)/2',4],['4-8',-4],['(4**3)**0.5',8],['(24/6)**0.5',2],['(2*8)**0.5',4],
    ['1/(2**3)',0.125],['40*300/200',60],['2*8*300/4',1200],['80/8',10],['2/2',1]
  ];
  for(const [expr,expected] of checks) assert.ok(Math.abs(arithmetic(expr)-expected)<1e-10,expr);
});
test('foundational lessons exist and cover the exact non-named B55 clauses', () => {
  assert.ok(existsSync(file('foundations')), 'authored foundations dataset must exist');
  const lessons = load('foundations');
  assert.ok(lessons.length >= 11);
  assert.equal(new Set(lessons.map(x=>x.id)).size, lessons.length);
  for (const ref of required) assert.ok(lessons.some(x=>x.rule_refs.includes(ref)), `missing ${ref}`);
  assert.deepEqual(lessons.filter(x=>x.category==='method').map(x=>x.title).sort(), ['transits','radial velocity','microlensing','direct imaging'].sort());
  for (const l of lessons) {
    assert.match(l.id, /^(foundation|method|math)-/);
    assert.equal(l.scope_status,'pending_rules_review');
    assert.equal(l.season,'2026-2027');
    assert.ok(l.sections.length >= 3);
    assert.ok(l.sections.map(s=>s.text).join(' ').split(/\s+/).length >= 220, `${l.id} must teach, not stub`);
    for (const k of ['observation','instrument','inference','alternative','uncertainty']) assert.ok(l.evidence[k].length>20, `${l.id} ${k}`);
    assert.ok(l.teach_back.length>30);
    assert.ok(l.source_refs.length);
    for (const s of l.source_refs) {
      assert.match(s.url,/^https:\/\//); assert.ok(s.title && s.locator && s.status);
      assert.equal(s.checked_at,'2026-11-08');
    }
  }
});
