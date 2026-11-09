let nextMentorSection = 0;

export function mountMentorAccess(root, client) {
  const section = root.ownerDocument.createElement('section');
  const inputId = `mentor-code-${++nextMentorSection}`;
  section.className = 'panel';
  section.hidden = true;
  section.innerHTML = `<h3>Mentor access</h3>
    <label for="${inputId}">Mentor activation code</label>
    <input id="${inputId}" type="password" autocomplete="off" maxlength="128" value="" disabled>
    <div class="actions"><button type="button" class="secondary" data-mentor-action="activate" disabled>Activate mentor access</button></div>
    <p class="small muted" role="status" aria-live="polite"></p>`;
  root.append(section);
  const input = section.querySelector('input');
  const button = section.querySelector('button');
  const status = section.querySelector('[aria-live]');
  let userId = null;
  let active = false;
  let checking = false;
  let redeeming = false;
  // Identity epochs also distinguish sign-out and sign-in to the same account.
  let identityEpoch = 0;
  let statusVersion = 0;
  const clear = () => { input.value = ''; };
  function render() {
    section.hidden = !userId;
    input.disabled = button.disabled = !userId || active || checking || redeeming;
  }
  async function checkStatus(confirming = false) {
    if (!userId) return;
    const epoch = identityEpoch;
    const version = ++statusVersion;
    const current = () => epoch === identityEpoch && version === statusVersion;
    active = false;
    checking = true;
    status.textContent = 'Checking mentor access…';
    render();
    try {
      const result = await client.rpc('mentor_access_status');
      if (!current()) return;
      if (result?.error || typeof result?.data?.is_mentor !== 'boolean') throw new Error();
      active = result.data.is_mentor;
      status.textContent = active
        ? 'Mentor access active; classroom dashboard is being built.'
        : confirming
          ? 'Could not confirm mentor access. Reopen your account to check again.'
          : 'Enter your mentor activation code to activate access.';
    } catch {
      if (current()) status.textContent = 'Unable to check mentor access. Check your connection and reopen your account to try again.';
    } finally {
      if (current()) {
        checking = false;
        render();
      }
    }
  }
  const refresh = () => checkStatus();
  function update(nextUserId) {
    if (nextUserId && nextUserId === userId) return;
    identityEpoch++;
    statusVersion++;
    userId = nextUserId || null;
    active = checking = redeeming = false;
    clear();
    status.textContent = '';
    render();
    return refresh();
  }
  button.addEventListener('click', async event => {
    event.preventDefault();
    event.stopPropagation();
    if (!userId || button.disabled) return;
    if (input.value === '') {
      status.textContent = 'Enter your mentor activation code first.';
      return;
    }
    const epoch = identityEpoch;
    const current = () => epoch === identityEpoch;
    redeeming = true;
    status.textContent = 'Activating mentor access…';
    render();
    try {
      let request;
      try {
        request = client.rpc('redeem_mentor_code', { p_code: input.value });
      } finally {
        clear();
      }
      const result = await request;
      if (!current()) return;
      if (result?.error || typeof result?.data?.ok !== 'boolean') throw new Error();
      if (result.data.ok) await checkStatus(true);
      else {
        const messages = {
          invalid: 'That mentor code is not valid. Check it and try again.',
          rate_limited: 'Too many attempts. Try again later.',
          unavailable: 'Mentor activation is unavailable. Try again later.',
          auth_required: 'Please sign in again before activating mentor access.',
          revoked: 'Mentor access for this account was revoked. Contact the administrator; a new code cannot restore it.'
        };
        status.textContent = Object.hasOwn(messages, result.data.reason)
          ? messages[result.data.reason]
          : 'Unable to activate mentor access. Please try again.';
      }
    } catch {
      if (current()) status.textContent = 'Unable to activate mentor access. Check your connection and try again.';
    } finally {
      if (current()) {
        redeeming = false;
        render();
      }
    }
  });
  return { update, refresh, clear };
}
