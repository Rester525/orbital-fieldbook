import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {readFile} from 'node:fs/promises';

const moduleURL = new URL('../public/js/mentor-dashboard-ui.js', import.meta.url);
const stamp = '2026-11-09T12:00:00.000Z';
const member = (overrides = {}) => ({user_id: 'account-1', email: 'learner@example.org',
  created_at: stamp, last_sign_in_at: stamp, is_mentor: false, last_synced_at: stamp,
  has_progress: true, completed_weeks: 2, completed_steps: 9, practice_attempts: 10,
  mcq_attempts: 4, mcq_correct: 3, ...overrides});
const response = (members = [member()], total = members.length) => ({data: {total, members, fetched_at: stamp}, error: null});
const settle = () => new Promise(resolve => setImmediate(resolve));
async function mount(options = {}) {
  const {document, window} = parseHTML('<html><body><main></main></body></html>');
  const root = document.querySelector('main');
  const requests = [];
  const client = {rpc(name, args) {return new Promise((resolve, reject) => requests.push({name, args, resolve, reject}));}};
  const {renderMentorDashboard} = await import(moduleURL);
  const cleanup = renderMentorDashboard(root, client, options);
  const button = label => [...root.querySelectorAll('button')].find(b => b.textContent === label);
  const click = label => button(label).dispatchEvent(new window.Event('click', {bubbles: true}));
  return {root, requests, cleanup, button, click};
}

test('renders signed-in accounts, mentor identity, timestamps and honest summary measures', async () => {
  const {root, requests, cleanup} = await mount();
  requests[0].resolve(response([member({is_mentor: true})]));
  await settle();
  const row = root.querySelector('tbody tr');
  assert.ok(row, 'server account is rendered');
  assert.match(row.textContent, /learner@example.org/);
  assert.match(row.textContent, /Mentor/);
  assert.equal(row.querySelectorAll('time').length, 3);
  for (const time of row.querySelectorAll('time')) assert.equal(time.getAttribute('datetime'), stamp);
  assert.match(row.textContent, /2 \/ 11 weeks/);
  assert.match(row.textContent, /9 \/ 44 steps/);
  assert.match(row.textContent, /10 practice attempts/);
  assert.match(row.textContent, /75% MCQ accuracy/);
  assert.match(row.textContent, /3 \/ 4 correct/);
  assert.match(root.textContent, /self-reported/i);
  assert.match(root.textContent, /not assessed lesson mastery/i);
  assert.match(root.textContent, /not.*online presence/i);
  assert.match(root.textContent, /Guests are not included/);
  assert.match(root.textContent, /private notes, answers, reflections/i);
  assert.match(root.textContent, /Showing 1–1 of 1 accounts/);
  assert.equal(root.querySelector('[role="region"]').getAttribute('tabindex'), '0');
  assert.ok(root.querySelector('caption'));
  assert.equal(root.querySelector('[aria-busy="true"]'), null);
  cleanup();
});

test('paginates 50 accounts with exact totals and prevents duplicate in-flight paging', async () => {
  const {root, requests, button, click, cleanup} = await mount();
  const page = Array.from({length: 50}, (_, i) => member({user_id: `a-${i}`, email: `account-${i}@example.org`}));
  requests[0].resolve(response(page, 51));
  await settle();
  assert.match(root.textContent, /Showing 1–50 of 51 accounts/);
  assert.equal(button('Previous').disabled, true);
  assert.equal(button('Next').disabled, false);
  click('Next'); click('Next'); click('Previous');
  assert.equal(requests.length, 2);
  assert.deepEqual(requests[1].args, {p_offset: 50, p_limit: 50});
  assert.equal(root.querySelectorAll('tbody tr').length, 0);
  assert.equal(button('Next').disabled, true);
  requests[1].resolve(response([member({user_id: 'last'})], 51));
  await settle();
  assert.match(root.textContent, /Showing 51–51 of 51 accounts/);
  assert.equal(button('Next').disabled, true);
  click('Previous');
  assert.deepEqual(requests[2].args, {p_offset: 0, p_limit: 50});
  requests[2].resolve(response(page, 51));
  await settle();
  click('Refresh');
  assert.equal(root.querySelectorAll('tbody tr').length, 0);
  assert.deepEqual(requests[3].args, {p_offset: 0, p_limit: 50});
  cleanup();
});

test('never invents zero progress for unsynced or unsupported state and accepts unknown creation date', async () => {
  const {root, requests, cleanup} = await mount();
  const unavailable = {has_progress: false, completed_weeks: null, completed_steps: null, practice_attempts: null, mcq_attempts: null, mcq_correct: null};
  requests[0].resolve(response([
    member({...unavailable, created_at: null, last_synced_at: null}),
    member({...unavailable, user_id: 'unsupported'}),
    member({user_id: 'written-only', practice_attempts: 3, mcq_attempts: 0, mcq_correct: 0, completed_weeks: 0, completed_steps: 0})
  ]));
  await settle();
  const rows = [...root.querySelectorAll('tbody tr')];
  assert.match(rows[0].textContent, /Not synced yet/);
  assert.match(rows[0].textContent, /Unknown/);
  assert.match(rows[1].textContent, /Progress unavailable/);
  for (const row of rows.slice(0, 2)) assert.doesNotMatch(row.textContent, /0 \/|0%|null|Invalid Date/);
  assert.match(rows[2].textContent, /0 \/ 11 weeks/);
  assert.match(rows[2].textContent, /3 practice attempts/);
  assert.match(rows[2].textContent, /No MCQ attempts yet/);
  assert.doesNotMatch(rows[2].textContent, /NaN|Infinity|0%/);
  cleanup();
});

test('empty roster has its own state and exact zero range', async () => {
  const {root, requests, button, cleanup} = await mount();
  requests[0].resolve(response([]));
  await settle();
  assert.match(root.querySelector('[role="status"]').textContent, /No accounts have signed in yet/);
  assert.match(root.textContent, /Showing 0–0 of 0 accounts/);
  assert.equal(root.querySelectorAll('tbody tr').length, 0);
  assert.equal(root.querySelector('[role="region"]').hidden, true);
  assert.equal(button('Next').disabled, true);
  assert.equal(button('Previous').disabled, true);
  cleanup();
});

test('RPC errors clear sensitive data and refresh can recover without exposing server messages', async () => {
  const {root, requests, click, cleanup, button} = await mount();
  requests[0].resolve(response()); await settle();
  click('Refresh');
  requests[1].resolve({data: response().data, error: {code: 'XX000', message: '<img src=x> private failure'}});
  await settle();
  assert.equal(root.querySelectorAll('tbody tr').length, 0);
  assert.doesNotMatch(root.textContent, /learner@example.org|private failure|Showing/);
  assert.match(root.querySelector('[role="alert"]').textContent, /Could not load accounts/);
  assert.equal(button('Previous').disabled, true);
  assert.equal(button('Next').disabled, true);
  click('Refresh'); requests[2].reject(new Error('network down')); await settle();
  assert.match(root.querySelector('[role="alert"]').textContent, /Could not load accounts/);
  click('Refresh'); requests[3].resolve(response()); await settle();
  assert.match(root.textContent, /learner@example.org/);
  assert.equal(root.querySelector('[role="alert"]'), null);
  cleanup();
});

test('malformed roster data is rejected atomically, including inconsistent summary counts', async t => {
  const invalid = [null, {}, {total: '1', members: [member()], fetched_at: stamp},
    {...response().data, fetched_at: 'bad'}, {...response().data, total: -1},
    {...response().data, total: 2}, {...response().data, members: {}},
    {...response().data, members: [null]},
    response([member(), member()]).data,
    ...[
      {email: null}, {is_mentor: 'true'}, {created_at: 'bad'}, {last_sign_in_at: null},
      {last_synced_at: 'bad'}, {has_progress: null}, {completed_weeks: 12}, {completed_steps: 45},
      {completed_weeks: -1}, {completed_steps: 2.5}, {completed_weeks: 3, completed_steps: 9},
      {practice_attempts: 2}, {mcq_correct: 5}, {mcq_attempts: '4'}, {practice_attempts: null},
      {mcq_correct: Number.MAX_SAFE_INTEGER + 1}, {completed_weeks: 0, completed_steps: 44}
    ].map(change => response([member(change)]).data)
  ];
  for (const [index, data] of invalid.entries()) await t.test(`invalid payload ${index}`, async () => {
    const {root, requests, cleanup} = await mount();
    requests[0].resolve({data, error: null}); await settle();
    assert.equal(root.querySelectorAll('tbody tr').length, 0);
    assert.match(root.querySelector('[role="alert"]')?.textContent || '', /Could not load accounts/);
    assert.doesNotMatch(root.textContent, /learner@example.org|Showing/);
    cleanup();
  });
});

test('overlapping refresh ignores stale successes and failures', async () => {
  let denied = 0;
  const {root, requests, click, cleanup} = await mount({onAccessDenied: () => denied++});
  click('Refresh');
  requests[1].resolve(response([member({email: 'latest@example.org'})])); await settle();
  requests[0].resolve(response([member({email: 'stale@example.org'})])); await settle();
  assert.match(root.textContent, /latest@example.org/);
  assert.doesNotMatch(root.textContent, /stale@example.org/);
  click('Refresh'); click('Refresh');
  requests[3].resolve(response([member({email: 'newest@example.org'})])); await settle();
  requests[2].reject({code: '42501'}); await settle();
  assert.match(root.textContent, /newest@example.org/);
  assert.equal(denied, 0);
  cleanup();
});

test('cleanup erases detached sensitive rows and invalidates pending responses and handlers', async () => {
  const {root, requests, click, button, cleanup} = await mount();
  requests[0].resolve(response()); await settle();
  const screen = root.querySelector('.mentor-dashboard');
  const refresh = button('Refresh');
  click('Refresh');
  cleanup(); cleanup();
  root.textContent = 'Another route';
  requests[1].resolve(response()); await settle();
  refresh.click();
  assert.equal(requests.length, 2);
  assert.equal(root.textContent, 'Another route');
  assert.doesNotMatch(screen.textContent, /learner@example.org/);
  const second = await mount();
  second.requests[0].resolve(response()); await settle();
  const detached = second.root.querySelector('.mentor-dashboard');
  second.cleanup();
  assert.doesNotMatch(detached.textContent, /learner@example.org/);
});

test('auth denial clears rows before notifying and permanently invalidates pending refreshes', async t => {
  for (const error of [{code: '42501'}, {code: '401'}, {status: 401}, {code: 'PGRST301'}, {code: 'PGRST302'}]) {
    await t.test(JSON.stringify(error), async () => {
      let notified = 0, ui;
      ui = await mount({onAccessDenied: () => {
        notified++;
        assert.equal(ui.root.querySelectorAll('tbody tr').length, 0);
        assert.doesNotMatch(ui.root.textContent, /learner@example.org|Showing/);
        ui.click('Refresh'); // A reentrant callback must not initiate another request.
      }});
      ui.requests[0].resolve(response()); await settle();
      ui.click('Refresh'); ui.click('Refresh');
      ui.requests[2].resolve({data: null, error}); await settle();
      assert.equal(notified, 1);
      assert.equal(ui.requests.length, 3);
      assert.match(ui.root.querySelector('[role="alert"]').textContent, /Access denied/);
      ui.requests[1].resolve(response()); await settle();
      assert.equal(ui.root.querySelectorAll('tbody tr').length, 0);
      ui.cleanup();
    });
  }
});

test('denial callback may replace the route or throw without late writes', async () => {
  let ui;
  ui = await mount({onAccessDenied: () => {ui.cleanup(); ui.root.textContent = 'Signed out'; throw new Error('callback failure');}});
  ui.click('Refresh');
  ui.requests[1].reject({code: '42501'}); await settle();
  ui.requests[0].resolve(response()); await settle();
  assert.equal(ui.root.textContent, 'Signed out');
});

test('HTTP 401 on the RPC envelope revokes access even without an error code', async () => {
  let denied = 0;
  const {root, requests, cleanup} = await mount({onAccessDenied: () => denied++});
  requests[0].resolve({data: null, error: {message: 'Unauthorized'}, status: 401}); await settle();
  assert.equal(denied, 1);
  assert.match(root.querySelector('[role="alert"]').textContent, /Access denied/);
  cleanup();
});

test('a page emptied by account removals offers Previous or Refresh without false rows', async () => {
  const {root, requests, click, button, cleanup} = await mount();
  requests[0].resolve(response(Array.from({length: 50}, (_, i) => member({user_id: String(i)})), 51)); await settle();
  click('Next');
  requests[1].resolve(response([], 49)); await settle();
  assert.match(root.textContent, /No accounts on this page/);
  assert.match(root.textContent, /Showing 0–0 of 49 accounts/);
  assert.equal(button('Previous').disabled, false);
  assert.equal(button('Next').disabled, true);
  cleanup();
});

test('emails render as inert text and additional private properties never render', async () => {
  const {root, requests, cleanup} = await mount();
  const email = '<img src=x onerror="alert(1)"><script>alert(2)</script> & "hello"';
  requests[0].resolve(response([member({email, user_id: 'id" onclick="alert(3)', private_notes: 'secret-notes', raw_state: {answer: 'secret-answer'}})]));
  await settle();
  assert.equal(root.querySelector('.mentor-email').textContent, email);
  assert.equal(root.querySelector('img, script, [onerror], [onclick]'), null);
  assert.doesNotMatch(root.textContent, /secret-notes|secret-answer/);
  cleanup();
});

test('stylesheet is screen-scoped, token-based and provides keyboard-accessible mobile overflow', async () => {
  const css = await readFile(new URL('../public/css/mentor-dashboard.css', import.meta.url), 'utf8');
  const {document} = parseHTML('<html><head></head><body></body></html>');
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const rules = [...style.sheet.cssRules];
  assert.equal(rules.length, 1);
  assert.equal(rules[0].media.mediaText, 'screen');
  const leaves = [];
  function walk(list) {for (const rule of list) {if (rule.selectorText) leaves.push(rule); else if (rule.cssRules) walk(rule.cssRules);}}
  walk(rules);
  for (const rule of leaves) for (const selector of rule.selectorText.split(',')) assert.match(selector.trim(), /^\.mentor-dashboard(?:\s|:|$)/);
  const overflow = leaves.find(rule => rule.selectorText === '.mentor-dashboard .mentor-table-region');
  assert.equal(overflow.style.getPropertyValue('overflow-x'), 'auto');
  assert.ok(leaves.some(rule => rule.selectorText.includes(':focus-visible')));
  assert.match(css, /@media\s*\(max-width:\s*\d+px\)/);
  for (const token of ['--bg', '--card', '--ink', '--muted', '--line', '--accent', '--soft']) assert.ok(css.includes(`var(${token})`));
});

test('mount starts loading the real roster with a visible refresh action', async () => {
  const {root, requests, button, cleanup} = await mount();
  assert.equal(root.querySelector('h1').textContent, 'Mentor dashboard');
  assert.ok(button('Refresh'));
  assert.match(root.querySelector('[role="status"]').textContent, /Loading/);
  assert.equal(root.querySelector('[aria-busy="true"]') !== null, true);
  assert.deepEqual(requests.map(r => [r.name, r.args]), [['mentor_team_roster', {p_offset: 0, p_limit: 50}]]);
  assert.equal(typeof cleanup, 'function');
  cleanup();
});
