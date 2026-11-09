import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {defaultState} from '../public/js/storage.js';

const moduleURL = new URL('../public/js/home-ui.js', import.meta.url);
const categories = ['foundation', 'world', 'system', 'mission', 'method', 'math'];
function fixture() {
  return {
    lessons: categories.map((category, i) => ({id: `lesson-${i}`, title: `Lesson ${i}`, category, summary: `Summary ${i}`, sections: []})),
    questions: [{id: 'q1', type: 'mcq'}, {id: 'q2', type: 'mcq'}, {id: 'q3', type: 'written'}, {id: 'q4', type: 'mcq'}],
    schedule: {
      missions: [
        {week: 1, topic: 'First supplied mission', mode: 'LIVE', date: '2026-11-08'},
        {week: 2, topic: 'Not supplied', mode: null, date: null},
        {week: 3, topic: 'Next supplied mission', mode: 'SELF', date: null}
      ],
      routine: ['read', 'practice', 'discuss', 'teach each other']
    }
  };
}
function stats(root) {
  return Object.fromEntries([...root.querySelectorAll('.dashboard-stat')].map(stat => [
    stat.querySelector('.stat-label').textContent,
    stat.querySelector('.stat-value').textContent
  ]));
}

function dom(html) {
  const {document, window} = parseHTML(`<html><body><main>${html}</main></body></html>`);
  return {root: document.querySelector('main'), window};
}

test('statistics derive accuracy from MCQ attempts and due recall only from current question IDs', async () => {
  const {homeHTML} = await import(moduleURL);
  const data = fixture(), state = defaultState();
  state.attempts = [
    {questionId: 'q1', correct: true}, {questionId: 'q1', correct: false},
    {questionId: 'q2', correct: true}, {questionId: 'retired-mcq', correct: true},
    {questionId: 'q3', correct: null, score: 1}, {questionId: 'retired-written', correct: null, score: 0}
  ];
  state.recall = {q1: {due: 999}, q2: {due: 1000}, q3: {due: 1001}, retired: {due: 0}};
  const snapshot = JSON.stringify({data, state});
  const {root} = dom(homeHTML(data, state, 1000));
  assert.deepEqual(stats(root), {'Lessons available': '6', 'MCQ accuracy': '75%', 'Recall due': '2'});
  assert.match(root.querySelector('.dashboard-stats').textContent, /4 graded attempts/);
  assert.equal(JSON.stringify({data, state}), snapshot, 'rendering must not change data or state');
  assert.equal(stats(dom(homeHTML(data, state, 1001)).root)['Recall due'], '3', 'written recall is eligible too');
});

test('new and empty states show honest zero counts and no invented accuracy or missions', async () => {
  const {homeHTML} = await import(moduleURL);
  const data = fixture(), state = defaultState();
  assert.deepEqual(stats(dom(homeHTML(data, state, 1000)).root), {
    'Lessons available': '6', 'MCQ accuracy': '—', 'Recall due': '0'
  });
  state.attempts = [{questionId: 'q3', correct: null, score: 1}];
  data.lessons = []; data.questions = []; data.schedule.missions = []; data.schedule.routine = [];
  const {root} = dom(homeHTML(data, state, 1000));
  assert.deepEqual(stats(root), {'Lessons available': '0', 'MCQ accuracy': '—', 'Recall due': '0'});
  assert.match(root.textContent, /No graded attempts yet/);
  assert.match(root.textContent, /No weekly routine supplied/);
  assert.equal(root.querySelector('.home-hero a.button').getAttribute('href'), '#library');
  for (const card of root.querySelectorAll('.collection-card')) assert.match(card.textContent, /0 lessons/);
});

test('live global search finds titles and lesson content, clears, and submits without navigation or mutation', async () => {
  const {homeHTML, bindHome} = await import(moduleURL);
  const data = fixture();
  data.lessons[0].title = 'Europa';
  data.lessons[1].sections = [{heading: 'Instruments', text: 'A distinctive spectrum discussion'}];
  const snapshot = JSON.stringify(data);
  const {root, window} = dom(homeHTML(data, defaultState()));
  bindHome(root, data);
  const input = root.querySelector('input[type="search"]');
  const form = root.querySelector('form[role="search"]');
  const results = root.querySelector('.home-search-results');
  assert.ok(root.querySelector(`label[for="${input.id}"]`), 'search has a visible label');
  assert.equal(results.getAttribute('aria-live'), 'polite');
  const search = value => { input.value = value; input.dispatchEvent(new window.Event('input', {bubbles: true})); };
  search('  EUROPA ');
  assert.deepEqual([...results.querySelectorAll('a')].map(a => a.getAttribute('href')), ['#lesson/lesson-0']);
  search('distinctive spectrum');
  assert.equal(results.querySelector('a').getAttribute('href'), '#lesson/lesson-1');
  search('no matching topic');
  assert.equal(results.querySelector('a'), null);
  assert.match(results.textContent, /No lessons match/);
  search('   ');
  assert.equal(results.querySelector('a'), null);
  assert.match(results.textContent, /Search all 6 lessons/);
  input.value = 'Europa';
  const submit = new window.Event('submit', {bubbles: true, cancelable: true});
  form.dispatchEvent(submit);
  assert.equal(submit.defaultPrevented, true, 'native submission cannot reload or navigate');
  assert.equal(results.querySelector('a').getAttribute('href'), '#lesson/lesson-0');
  assert.equal(JSON.stringify(data), snapshot);
});

test('search safely renders malicious lesson titles, summaries, IDs, and queries as text', async () => {
  const {homeHTML, bindHome} = await import(moduleURL);
  const data = fixture();
  const title = '<img src=x onerror="alert(1)"> & a lesson';
  data.lessons = [{id: 'bad" onclick="alert(1)', title, category: 'world', summary: '<script>alert(2)</script>'}];
  data.schedule.missions[0].topic = title;
  const {root, window} = dom(homeHTML(data, defaultState()));
  assert.match(root.querySelector('.continue-card').textContent, /<img/);
  bindHome(root, data);
  const input = root.querySelector('input[type="search"]');
  input.value = '<img';
  input.dispatchEvent(new window.Event('input', {bubbles: true}));
  const result = root.querySelector('.home-search-results a');
  assert.ok(result.textContent.includes(title));
  assert.equal(result.getAttribute('href'), `#lesson/${data.lessons[0].id}`);
  assert.equal(root.querySelector('img, script, [onerror], [onclick]'), null);
  input.value = '<svg onload="alert(3)">';
  input.dispatchEvent(new window.Event('input', {bubbles: true}));
  assert.equal(root.querySelector('[onload]'), null);
  assert.match(root.querySelector('.home-search-results').textContent, /No lessons match/);
});

test('empty library search is useful and binding an unrelated root is harmless', async () => {
  const {homeHTML, bindHome} = await import(moduleURL);
  const data = fixture(); data.lessons = [];
  const {root, window} = dom(homeHTML(data, defaultState()));
  bindHome(root, data);
  assert.match(root.querySelector('.home-search-results').textContent, /No lessons available/);
  const input = root.querySelector('input[type="search"]');
  input.value = 'anything'; input.dispatchEvent(new window.Event('input', {bubbles: true}));
  assert.match(root.querySelector('.home-search-results').textContent, /No lessons available/);
  assert.doesNotThrow(() => bindHome(dom('<p>Another route</p>').root, data));
});

test('dashboard renders native navigation and actual collection counts without a global document', async () => {
  const {homeHTML} = await import(moduleURL);
  assert.equal(typeof globalThis.document, 'undefined');
  const data = fixture();
  const {root} = dom(homeHTML(data, defaultState(), 1000));
  assert.equal(root.querySelectorAll('h1').length, 1);
  assert.equal(root.querySelector('.home-hero a.button').getAttribute('href'), '#mission/1');
  assert.deepEqual([...root.querySelectorAll('.quick-actions a')].map(a => a.getAttribute('href')),
    ['#practice/quick', '#practice/recall', '#practice/simulation', '#labs']);
  assert.deepEqual([...root.querySelectorAll('.collection-card')].map(a => a.getAttribute('href')),
    categories.map(category => `#library/${category}`));
  for (const card of root.querySelectorAll('.collection-card')) assert.match(card.textContent, /1 lesson\b/);
  assert.ok(root.querySelector('.home-bottom a[href="#missions"]'));
  assert.deepEqual([...root.querySelectorAll('.home-bottom ol li')].map(li => li.textContent), data.schedule.routine);
});

test('continue skips completed and unsupplied missions, respects edited schedule, then falls back to library', async () => {
  const {homeHTML} = await import(moduleURL);
  const data = fixture(), state = defaultState();
  state.missions[1] = {steps: [true, true, true, true], evidence: ''};
  let root = dom(homeHTML(data, state)).root;
  assert.equal(root.querySelector('.home-hero a.button').getAttribute('href'), '#mission/3');
  assert.match(root.querySelector('.continue-card').textContent, /Next supplied mission/);
  assert.match(root.querySelector('.continue-card').textContent, /Date not supplied/);
  state.schedule = [{week: 5, topic: 'Edited mission', mode: 'LIVE', date: null}];
  root = dom(homeHTML(data, state)).root;
  assert.equal(root.querySelector('.home-hero a.button').getAttribute('href'), '#mission/5');
  assert.match(root.querySelector('.continue-card').textContent, /Edited mission/);
  state.missions[5] = {steps: [true, true, true, true], evidence: ''};
  root = dom(homeHTML(data, state)).root;
  assert.equal(root.querySelector('.home-hero a.button').getAttribute('href'), '#library');
  assert.match(root.querySelector('.continue-card').textContent, /No incomplete supplied missions/);
});
