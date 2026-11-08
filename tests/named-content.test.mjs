import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(`public/data/${name}.json`, root), 'utf8'));
const worlds = ['Venus','Mars','Ganymede','Europa','Enceladus','Titan','Makemake','101955 Bennu','67P/Churyumov–Gerasimenko'];
const systems = ['TRAPPIST-1','Kepler-452','LHS 1140'];
const missions = ['Venus Express','DAVINCI','VERITAS','Perseverance','Mars Reconnaissance Orbiter','MAVEN','Galileo','Europa Clipper','JUICE','Cassini-Huygens','Dragonfly','OSIRIS-REx','Rosetta','Kepler','JWST','Roman Space Telescope'];
const words = text => text.trim().split(/\s+/).length;
function citations(refs) {
  assert.ok(Array.isArray(refs) && refs.length > 0);
  for (const r of refs) {
    assert.match(r.url, /^https:\/\/(?:[a-z.-]+\.)?(?:nasa\.gov|esa\.int)\/.+/);
    assert.ok(r.title.length > 5);
    assert.ok(r.locator.length > 5);
    assert.match(r.checked_at, /^2026-11-08/);
    assert.equal(r.status, 'checked');
    const ledger = readFileSync(new URL('NAMED_CONTENT_SOURCES.md', root), 'utf8');
    assert.ok(ledger.includes(r.url), `unlogged source ${r.url}`);
  }
}
test('all four named content files exist', () => {
  for (const n of ['worlds','missions','questions-worlds','questions-missions']) assert.ok(existsSync(new URL(`public/data/${n}.json`, root)), `${n} missing`);
});
test('exact curriculum lists, no substituted or extra names', () => {
  const w = read('worlds');
  assert.equal(w.length, 12);
  assert.equal(read('missions').length, 16);
  assert.deepEqual(w.filter(x => x.category === 'world').map(x => x.title), worlds);
  assert.deepEqual(w.filter(x => x.category === 'system').map(x => x.title), systems);
  assert.deepEqual(read('missions').map(x => x.title), missions);
});
test('each named lesson has substantive original sections and an evidence chain', () => {
  const lessons = [...read('worlds'), ...read('missions')];
  assert.equal(new Set(lessons.map(x => x.id)).size, 28);
  for (const x of lessons) {
    assert.ok(x.id.startsWith(`${x.category}-`));
    assert.equal(x.season, '2026-2027');
    assert.equal(x.scope_status, 'pending_rules_review');
    assert.ok(x.rule_refs.includes(x.category === 'mission' ? '3.b.v' : x.category === 'world' ? '3.a.i' : '3.a.ii'));
    assert.ok(x.summary.length > 50);
    assert.ok(x.sections.length >= 3);
    assert.ok(words(x.sections.map(s => s.text).join(' ')) >= 180, `${x.id}: substantive explanations`);
    for (const s of x.sections) {
      assert.ok(s.heading);
      assert.ok(words(s.text) >= 35);
      const markers = [...s.text.matchAll(/\[(\d+)\]/g)].map(m => Number(m[1]));
      assert.ok(markers.length > 0, `${x.id}: section citation`);
      assert.ok(markers.every(n => n >= 1 && n <= x.source_refs.length));
    }
    for (const k of ['observation','instrument','inference','alternative','uncertainty']) assert.ok(words(x.evidence[k]) >= 10, `${x.id}.${k}`);
    assert.ok(x.teach_back.length > 50);
    assert.doesNotMatch(JSON.stringify(x), /<\/?(?:script|iframe|div|p|img)\b/i);
    citations(x.source_refs);
  }
});
test('original written reasoning for every named entry plus keyed comparison MCQs', () => {
  const lessons = [...read('worlds'), ...read('missions')];
  const qs = [...read('questions-worlds'), ...read('questions-missions')];
  assert.equal(read('questions-worlds').length, 18);
  assert.equal(read('questions-missions').length, 22);
  assert.equal(qs.filter(q => q.type === 'written').length, 28);
  assert.equal(qs.filter(q => q.type === 'mcq').length, 12);
  assert.equal(new Set(qs.map(q => q.id)).size, qs.length);
  for (const l of lessons) assert.ok(qs.some(q => q.lesson_id === l.id && q.type === 'written' && q.kind === 'reasoning'), `${l.id} needs written reasoning`);
  assert.ok(qs.filter(q => q.type === 'mcq' && q.kind === 'comparison').length >= 8);
  for (const q of qs) {
    assert.ok(lessons.some(l => l.id === q.lesson_id));
    assert.ok(q.prompt.length > 50);
    assert.ok(q.explanation.length > 80);
    assert.ok(q.rule_refs.length);
    assert.ok(q.difficulty);
    if (q.type === 'mcq') {
      assert.equal(q.options.length, 4);
      assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4);
      assert.equal(new Set(q.options).size, 4);
    } else {
      assert.equal(q.type, 'written');
      assert.ok(Array.isArray(q.rubric) && q.rubric.length >= 3);
      assert.ok(q.rubric.every(s => typeof s === 'string' && s.length > 15));
    }
    citations(q.source_refs);
  }
});
