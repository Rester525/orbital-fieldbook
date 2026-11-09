export function mountMentorAccess(root, client, {onAccessChange=()=>{}}={}) {
  const section = root.ownerDocument.createElement('section');
  section.className = 'panel';
  section.hidden = true;
  section.innerHTML = '<h3>Mentor access</h3><p class="small muted" role="status" aria-live="polite"></p><a href="#mentor" class="button secondary" hidden>Open mentor dashboard</a>';
  root.append(section);
  const status = section.querySelector('[aria-live]');
  const link = section.querySelector('a');
  const report = active => {link.hidden=!active;onAccessChange(active,userId);};
  let userId = null, identityEpoch = 0, statusVersion = 0;
  async function refresh() {
    if (!userId) return;
    const epoch = identityEpoch, version = ++statusVersion;
    const current = () => epoch === identityEpoch && version === statusVersion;
    report(false);
    status.textContent = 'Checking mentor access…';
    try {
      const result = await client.rpc('mentor_access_status');
      if (!current()) return;
      if (result?.error || typeof result?.data?.is_mentor !== 'boolean') throw new Error();
      status.textContent = result.data.is_mentor
        ? 'Mentor access active. Your team dashboard is ready.'
        : 'Mentor access is reserved for the designated owner account.';
      report(result.data.is_mentor);
    } catch {
      if (current()) status.textContent = 'Unable to check mentor access. Check your connection and reopen your account to try again.';
    }
  }
  function update(nextUserId) {
    if (nextUserId && nextUserId === userId) return;
    identityEpoch++;
    statusVersion++;
    userId = nextUserId || null;
    status.textContent = '';
    section.hidden = !userId;
    if(!userId)report(false);
    return refresh();
  }
  return {update, refresh};
}
