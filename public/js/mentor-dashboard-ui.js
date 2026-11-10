import {esc} from './view.js';

const PAGE_SIZE = 50;
const count = value => Number.isSafeInteger(value) && value >= 0;
const validTime = value => typeof value === 'string'
  && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  && Number.isFinite(Date.parse(value));
const nullableTime = value => value === null || validTime(value);
function validMember(member) {
  if (!member || typeof member.user_id !== 'string' || !member.user_id
    || typeof member.email !== 'string' || !member.email
    || typeof member.is_mentor !== 'boolean' || typeof member.has_progress !== 'boolean'
    || !nullableTime(member.created_at) || !validTime(member.last_sign_in_at)
    || !nullableTime(member.last_synced_at)) return false;
  const values = [member.completed_weeks, member.completed_steps, member.practice_attempts, member.mcq_attempts, member.mcq_correct];
  if (!member.has_progress) return values.every(value => value === null);
  return values.every(count) && member.last_synced_at !== null
    && member.completed_weeks <= 11 && member.completed_steps <= 44
    && member.completed_steps >= member.completed_weeks * 4
    && member.completed_steps <= member.completed_weeks * 4 + (11 - member.completed_weeks) * 3
    && member.mcq_correct <= member.mcq_attempts && member.mcq_attempts <= member.practice_attempts;
}
function validRoster(data, offset) {
  return data && count(data.total) && validTime(data.fetched_at) && Array.isArray(data.members)
    && data.members.length === Math.min(PAGE_SIZE, Math.max(0, data.total - offset))
    && data.members.every(validMember)
    && new Set(data.members.map(member => member.user_id)).size === data.members.length;
}
const timestamp = value => `<time datetime="${esc(value)}">${esc(new Date(value).toLocaleString(undefined, {dateStyle: 'medium', timeStyle: 'short'}))}</time>`;

function rowHTML(member) {
  const candidate = typeof member.display_name === 'string' ? member.display_name.trim() : '';
  const name = [...candidate].length <= 80 ? candidate : '';
  const unavailable = member.last_synced_at === null ? 'Not synced yet' : 'Progress unavailable';
  const routine = member.has_progress
    ? `<strong>${esc(member.completed_weeks)} / 11 weeks</strong><small>${esc(member.completed_steps)} / 44 steps</small>`
    : unavailable;
  const practice = member.has_progress
    ? `<strong>${esc(member.practice_attempts)} practice attempts</strong>${member.mcq_attempts
      ? `<small>${Math.round(100 * member.mcq_correct / member.mcq_attempts)}% MCQ accuracy</small><small>${esc(member.mcq_correct)} / ${esc(member.mcq_attempts)} correct</small>`
      : '<small>No MCQ attempts yet</small>'}`
    : unavailable;
  return `<tr><th scope="row">${name ? `<strong class="mentor-name">${esc(name)}</strong>` : ''}<span class="mentor-email">${esc(member.email)}</span><span class="mentor-role">${member.is_mentor ? 'Mentor' : 'Student'}</span></th>
    <td>${member.created_at === null ? 'Unknown' : timestamp(member.created_at)}</td><td>${timestamp(member.last_sign_in_at)}</td>
    <td>${member.last_synced_at === null ? 'Not synced yet' : timestamp(member.last_synced_at)}</td>
    <td>${routine}</td><td>${practice}</td></tr>`;
}

/** Mount only after a positive owner-role check; the RPC independently authorizes access. */
export function renderMentorDashboard(root, client, {onAccessDenied = () => {}} = {}) {
  root.innerHTML = `<section class="mentor-dashboard" aria-busy="true">
    <header class="mentor-header"><div><p class="mentor-kicker">TEAM OVERVIEW · OWNER ONLY</p><h1>Mentor dashboard</h1><p>Every account that has signed in to this team, including yours.</p></div><button type="button" data-action="refresh">Refresh</button></header>
    <aside class="mentor-context"><p><strong>Weekly routine is self-reported.</strong> 11 weeks × 4 self-marked steps; not assessed lesson mastery.</p><p>Latest sign-in is not current online presence. Practice accuracy counts MCQ attempts only, not written attempts.</p></aside>
    <p class="mentor-status" role="status" aria-live="polite">Loading accounts…</p>
    <div class="mentor-table-region" role="region" aria-label="Team accounts; scroll horizontally for all summaries" tabindex="0" hidden>
      <table><caption>Signed-in accounts · timestamps shown in your local time</caption><thead><tr><th scope="col">Account / role</th><th scope="col">Account created</th><th scope="col">Latest sign-in</th><th scope="col">Latest sync</th><th scope="col">Weekly self-marked routine</th><th scope="col">Practice summary</th></tr></thead><tbody></tbody></table>
    </div>
    <footer class="mentor-footer"><div><p class="mentor-range"></p><p class="mentor-fetched"></p></div><nav aria-label="Account pages"><button type="button" class="secondary" data-action="previous" disabled>Previous</button><button type="button" class="secondary" data-action="next" disabled>Next</button></nav></footer>
    <p class="mentor-privacy"><strong>Privacy:</strong> Only account details (including self-provided display names) and summary counts are shared here—never raw study state, private notes, answers, reflections, or other account metadata. Guests are not included.</p>
  </section>`;
  const screen = root.querySelector('.mentor-dashboard');
  const status = screen.querySelector('[role="status"]');
  const region = screen.querySelector('[role="region"]');
  const rows = screen.querySelector('tbody');
  const range = screen.querySelector('.mentor-range');
  const fetched = screen.querySelector('.mentor-fetched');
  const previous = screen.querySelector('[data-action="previous"]');
  const next = screen.querySelector('[data-action="next"]');
  const refresh = screen.querySelector('[data-action="refresh"]');
  let offset = 0, busy = false, disposed = false, denied = false, generation = 0;
  async function load(target = 0) {
    if (disposed || denied) return;
    const request = ++generation;
    busy = true;
    previous.disabled = next.disabled = true;
    rows.replaceChildren();
    region.hidden = true;
    range.textContent = fetched.textContent = '';
    status.setAttribute('role', 'status');
    status.textContent = 'Loading accounts…';
    screen.setAttribute('aria-busy', 'true');
    try {
      const result = await client.rpc('mentor_team_roster', {p_offset: target, p_limit: PAGE_SIZE});
      if (disposed || denied || request !== generation) return;
      if (String(result?.status) === '401') throw {code: '401'};
      if (result?.error) throw result.error;
      const data = result?.data;
      if (!validRoster(data, target)) throw new Error('Invalid roster response');
      offset = target;
      rows.innerHTML = data.members.map(rowHTML).join('');
      region.hidden = data.members.length === 0;
      range.textContent = `Showing ${data.members.length ? offset + 1 : 0}–${data.members.length ? offset + data.members.length : 0} of ${data.total} accounts`;
      fetched.innerHTML = `Updated ${timestamp(data.fetched_at)}`;
      status.textContent = !data.total ? 'No accounts have signed in yet.'
        : data.members.length ? 'Accounts loaded.' : 'No accounts on this page. Select Previous or Refresh.';
      previous.disabled = offset === 0;
      next.disabled = offset + data.members.length >= data.total;
    } catch (error) {
      if (disposed || denied || request !== generation) return;
      rows.replaceChildren();
      region.hidden = true;
      range.textContent = fetched.textContent = '';
      previous.disabled = next.disabled = true;
      status.setAttribute('role', 'alert');
      status.textContent = 'Could not load accounts. Check your connection and select Refresh to try again.';
      if (['42501', '401', 'PGRST301', 'PGRST302'].includes(String(error?.code)) || String(error?.status) === '401') {
        // Revoke this mount before calling out: callbacks may navigate or refresh.
        denied = true;
        generation++;
        busy = false;
        refresh.disabled = true;
        screen.setAttribute('aria-busy', 'false');
        status.textContent = 'Access denied. Sign in with the owner account to view this dashboard.';
        try { Promise.resolve(onAccessDenied()).catch(() => {}); } catch { /* Keep revoked even if the host callback fails. */ }
        return;
      }
    }
    screen.setAttribute('aria-busy', 'false');
    busy = false;
  }
  const refreshPage = () => load(0);
  const previousPage = () => { if (!busy && !previous.disabled) load(Math.max(0, offset - PAGE_SIZE)); };
  const nextPage = () => { if (!busy && !next.disabled) load(offset + PAGE_SIZE); };
  refresh.addEventListener('click', refreshPage);
  previous.addEventListener('click', previousPage);
  next.addEventListener('click', nextPage);
  load();
  return () => {
    disposed = true;
    generation++;
    refresh.removeEventListener('click', refreshPage);
    previous.removeEventListener('click', previousPage);
    next.removeEventListener('click', nextPage);
    rows.replaceChildren();
    screen.replaceChildren();
    screen.remove();
  };
}
