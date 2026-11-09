import test from 'node:test';
import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { readFile } from 'node:fs/promises';
import { mountMentorAccess } from '../public/js/mentor-access-ui.js';

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const role = is_mentor => ({ data: { is_mentor }, error: null });
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup() {
  const { document, window } = parseHTML('<html><body><form id="account-form"><p id="existing">Account</p><div id="mount"></div></form></body></html>');
  const calls = [];
  const client = { rpc(name, args) {
    const pending = deferred();
    calls.push({ name, args, ...pending });
    return pending.promise;
  } };
  const root = document.querySelector('#mount');
  const api = mountMentorAccess(root, client);
  const section = root.querySelector('section');
  const input = section.querySelector('input');
  const button = section.querySelector('button');
  const status = section.querySelector('[aria-live]');
  const click = () => button.dispatchEvent(new window.Event('click', { bubbles: true, cancelable: true }));
  return { document, window, root, section, input, button, status, calls, api, click, client };
}

async function signedIn() {
  const s = setup();
  const login = s.api.update('user-a');
  s.calls[0].resolve(role(false));
  await login;
  return s;
}

test('activation sends exact input once, clears it immediately and requires status readback', async () => {
  const s = await signedIn();
  let delegated = 0;
  s.root.addEventListener('click', () => delegated++);
  const placeholder = '  Test-Only-MiXeD Placeholder  ';
  s.input.value = placeholder;
  s.click();
  s.click();
  assert.equal(delegated, 0);
  assert.equal(s.calls.length, 2);
  assert.equal(s.calls[1].name, 'redeem_mentor_code');
  assert.deepEqual(s.calls[1].args, { p_code: placeholder });
  assert.equal(s.input.value, '');
  assert.equal(s.button.disabled, true);
  assert.doesNotMatch(s.status.textContent, /access active/i);
  s.calls[1].resolve({ data: { ok: true }, error: null });
  await flush();
  assert.equal(s.calls.length, 3);
  assert.equal(s.calls[2].name, 'mentor_access_status');
  assert.doesNotMatch(s.status.textContent, /access active/i);
  s.calls[2].resolve(role(true));
  await flush();
  assert.match(s.status.textContent, /^Mentor access active; classroom dashboard is being built\.$/);
  assert.equal(s.button.disabled, true);
});

for (const [reason, message] of [
  ['invalid', /code.*not valid/i],
  ['rate_limited', /too many attempts.*try again later/i],
  ['unavailable', /unavailable.*try again later/i],
  ['auth_required', /sign in.*again/i],
  ['revoked', /access.*revoked.*administrator/i],
  ['unexpected-internal-detail', /unable.*try again/i]
]) {
  test(`activation failure ${reason} is honest and allows retry`, async () => {
    const s = await signedIn();
    s.input.value = 'test-only-placeholder';
    s.click();
    s.calls[1].resolve({ data: { ok: false, reason }, error: null });
    await flush();
    assert.match(s.status.textContent, message);
    assert.doesNotMatch(s.status.textContent, /access active|unexpected-internal-detail/i);
    assert.equal(s.button.disabled, false);
    assert.equal(s.input.value, '');
    assert.equal(s.calls.length, 2);
  });
}

for (const mode of ['rpc-error', 'offline', 'malformed', 'not-active']) {
  test(`activation readback ${mode} never claims access`, async () => {
    const s = await signedIn();
    s.input.value = 'test-only-placeholder';
    s.click();
    s.calls[1].resolve({ data: { ok: true }, error: null });
    await flush();
    if (mode === 'offline') s.calls[2].reject(new Error('private-network-detail'));
    else s.calls[2].resolve(mode === 'rpc-error'
      ? { data: { is_mentor: true }, error: { message: 'private-network-detail' } }
      : mode === 'malformed' ? { data: { is_mentor: 'true' }, error: null } : role(false));
    await flush();
    assert.doesNotMatch(s.status.textContent, /access active|private-network-detail/i);
    assert.match(s.status.textContent, /could not confirm|unable to check/i);
    assert.equal(s.button.disabled, false);
  });
}

for (const mode of ['rpc-error', 'offline', 'malformed']) {
  test(`redemption ${mode} clears input and exposes no internal errors`, async () => {
    const s = await signedIn();
    s.input.value = 'test-only-placeholder';
    s.click();
    if (mode === 'offline') s.calls[1].reject(new Error('private-network-detail'));
    else s.calls[1].resolve(mode === 'rpc-error'
      ? { data: { ok: true }, error: { message: 'private-network-detail' } }
      : { data: null, error: null });
    await flush();
    assert.equal(s.calls.length, 2);
    assert.match(s.status.textContent, /unable.*try again/i);
    assert.doesNotMatch(s.status.textContent, /private-network-detail|access active/i);
    assert.equal(s.button.disabled, false);
    assert.equal(s.input.value, '');
  });
}

for (const phase of ['status', 'redemption', 'readback']) {
  for (const nextIdentity of [null, 'user-b']) {
    for (const fails of [false, true]) {
      test(`${phase} late ${fails ? 'failure' : 'success'} cannot affect ${nextIdentity || 'guest'}`, async () => {
        const s = setup();
        s.api.update('user-a');
        if (phase !== 'status') {
          s.calls[0].resolve(role(false));
          await flush();
          s.input.value = 'test-only-placeholder';
          s.click();
        }
        if (phase === 'readback') {
          s.calls[1].resolve({ data: { ok: true }, error: null });
          await flush();
        }
        const old = s.calls.at(-1);
        s.api.update(nextIdentity);
        const count = s.calls.length;
        const statusBefore = s.status.textContent;
        s.input.value = nextIdentity ? 'new-account-placeholder' : '';
        if (fails) old.reject(new Error('private-late-error'));
        else old.resolve(phase === 'redemption' ? { data: { ok: true }, error: null } : role(true));
        await flush();
        assert.equal(s.calls.length, count, 'stale redemption must not start readback');
        assert.equal(s.status.textContent, statusBefore);
        assert.equal(s.button.disabled, true, 'old completion must not unlock new request');
        assert.equal(s.section.hidden, !nextIdentity);
        assert.equal(s.input.value, nextIdentity ? 'new-account-placeholder' : '');
        if (nextIdentity) {
          s.calls.at(-1).resolve(role(false));
          await flush();
          assert.equal(s.button.disabled, false);
        }
      });
    }
  }
}

test('latest status request wins even when older success or failure arrives last', async () => {
  const s = await signedIn();
  s.api.refresh();
  s.api.refresh();
  s.calls[2].resolve(role(false));
  await flush();
  const latest = s.status.textContent;
  s.calls[1].resolve(role(true));
  await flush();
  assert.equal(s.status.textContent, latest);
  s.api.refresh();
  s.api.refresh();
  s.calls[4].resolve(role(true));
  await flush();
  s.calls[3].reject(new Error('private-late-error'));
  await flush();
  assert.match(s.status.textContent, /^Mentor access active/);
});

test('refresh during redemption cannot unlock duplicate submission or skip post-redemption readback', async () => {
  const s = await signedIn();
  s.input.value = 'test-only-placeholder';
  s.click();
  s.api.refresh();
  s.calls[2].resolve(role(false));
  await flush();
  assert.equal(s.button.disabled, true);
  s.input.value = 'duplicate-placeholder';
  s.click();
  assert.equal(s.calls.length, 3);
  s.calls[1].resolve({ data: { ok: true }, error: null });
  await flush();
  assert.equal(s.calls.length, 4);
  s.calls[3].resolve(role(true));
  await flush();
  assert.match(s.status.textContent, /^Mentor access active/);
});

test('new refresh supersedes post-activation readback without unlocking the new check', async () => {
  const s = await signedIn();
  s.input.value = 'test-only-placeholder';
  s.click();
  s.calls[1].resolve({ data: { ok: true }, error: null });
  await flush();
  s.api.refresh();
  s.calls[2].resolve(role(true));
  await flush();
  assert.equal(s.button.disabled, true);
  assert.doesNotMatch(s.status.textContent, /access active/i);
  s.calls[3].resolve(role(false));
  await flush();
  assert.equal(s.button.disabled, false);
  assert.doesNotMatch(s.status.textContent, /access active/i);
});

test('blank input does not spend an activation attempt', async () => {
  const s = await signedIn();
  s.click();
  assert.equal(s.calls.length, 1);
  assert.match(s.status.textContent, /enter.*code/i);
  assert.equal(s.button.disabled, false);
});

test('clear only erases input, leaving identity and pending requests intact', async () => {
  const s = await signedIn();
  s.input.value = 'test-only-placeholder';
  const before = s.status.textContent;
  s.api.clear();
  assert.equal(s.input.value, '');
  assert.equal(s.status.textContent, before);
  assert.equal(s.section.hidden, false);
  assert.equal(s.calls.length, 1);
  s.api.refresh();
  s.api.clear();
  s.calls[1].resolve(role(true));
  await flush();
  assert.match(s.status.textContent, /^Mentor access active/);
});

test('synchronous RPC exceptions are generic and still clear the submitted input', async () => {
  const s = await signedIn();
  s.client.rpc = () => { throw new Error('private-sync-error'); };
  s.input.value = 'test-only-placeholder';
  s.click();
  await flush();
  assert.equal(s.input.value, '');
  assert.equal(s.button.disabled, false);
  assert.match(s.status.textContent, /unable to activate/i);
  assert.doesNotMatch(s.status.textContent, /private-sync-error/);
  await s.api.refresh();
  assert.match(s.status.textContent, /unable to check/i);
  assert.equal(s.button.disabled, false);
});

test('no code or role is persisted and the source has no embedded activation secret', async () => {
  const source = await readFile(new URL('../public/js/mentor-access-ui.js', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|document\.cookie/);
  assert.doesNotMatch(source, /test-only-placeholder/);
  const s = await signedIn();
  s.input.value = 'test-only-placeholder';
  s.click();
  assert.doesNotMatch(s.root.innerHTML, /test-only-placeholder/);
  s.calls[1].resolve({ data: { ok: true }, error: null });
  await flush();
  s.calls[2].resolve(role(true));
  await flush();
  assert.equal(s.input.value, '');
  const fresh = setup();
  assert.equal(fresh.section.hidden, true);
  fresh.api.update('user-a');
  assert.doesNotMatch(fresh.status.textContent, /access active/i);
  assert.equal(fresh.calls.length, 1);
  fresh.calls[0].resolve(role(false));
  await flush();
});

test('multiple mounts keep controls and labels scoped without replacing account content', async () => {
  const s = setup();
  const other = mountMentorAccess(s.root, s.client);
  const sections = s.root.querySelectorAll('section');
  assert.equal(sections.length, 2);
  assert.notEqual(sections[0].querySelector('input').id, sections[1].querySelector('input').id);
  other.update('user-b');
  s.calls[0].resolve(role(true));
  await flush();
  assert.equal(s.section.hidden, true);
  assert.equal(s.status.textContent, '');
  assert.match(sections[1].textContent, /Mentor access active/);
});

test('signout then return to the same identity cannot revive its earlier request', async () => {
  const s = setup();
  s.api.update('user-a');
  s.api.update(null);
  s.api.update('user-a');
  assert.equal(s.calls.length, 2);
  s.calls[0].resolve(role(true));
  await flush();
  assert.doesNotMatch(s.status.textContent, /access active/i);
  assert.equal(s.button.disabled, true);
  s.calls[1].resolve(role(false));
  await flush();
  assert.equal(s.button.disabled, false);
});

test('login checks role once per identity transition and refresh rechecks backend authority', async () => {
  const s = setup();
  const login = s.api.update('user-a');
  assert.equal(s.section.hidden, false);
  assert.equal(s.calls.length, 1);
  assert.equal(s.calls[0].name, 'mentor_access_status');
  s.calls[0].resolve(role(false));
  await login;
  assert.equal(s.button.disabled, false);
  assert.doesNotMatch(s.status.textContent, /access active/i);
  s.api.update('user-a');
  assert.equal(s.calls.length, 1);
  const refresh = s.api.refresh();
  assert.equal(s.calls.length, 2);
  s.calls[1].resolve(role(true));
  await refresh;
  assert.equal(s.status.textContent, 'Mentor access active; classroom dashboard is being built.');
  assert.equal(s.button.disabled, true);
  assert.equal(s.section.querySelector('a'), null);
  const revoked = s.api.refresh();
  assert.doesNotMatch(s.status.textContent, /access active/i);
  s.calls[2].resolve(role(false));
  await revoked;
  assert.equal(s.button.disabled, false);
  s.api.update(null);
  assert.equal(s.section.hidden, true);
  assert.equal(s.status.textContent, '');
});

test('guest gets a scoped accessible section without a nested form or usable activation', async () => {
  const s = setup();
  assert.deepEqual(Object.keys(s.api).sort(), ['clear', 'refresh', 'update']);
  assert.equal(s.document.querySelectorAll('form').length, 1);
  assert.equal(s.document.querySelector('#existing').textContent, 'Account');
  assert.equal(s.input.type, 'password');
  assert.equal(s.input.value, '');
  assert.equal(s.input.getAttribute('autocomplete'), 'off');
  assert.equal(s.input.getAttribute('maxlength'), '128');
  assert.ok(s.section.querySelector(`label[for="${s.input.id}"]`));
  assert.equal(s.button.type, 'button');
  assert.equal(s.button.textContent, 'Activate mentor access');
  assert.equal(s.button.hasAttribute('data-account-action'), false);
  assert.equal(s.status.getAttribute('aria-live'), 'polite');
  assert.equal(s.section.hidden, true);
  assert.equal(s.button.disabled, true);
  s.input.value = 'test-only-placeholder';
  s.click();
  await s.api.refresh();
  assert.equal(s.calls.length, 0);
  s.api.update(null);
  assert.equal(s.input.value, '');
});
