import {esc} from './view.js';
import {currentSchedule, completion} from './missions-ui.js';

const collections = [
  ['foundation', 'Foundations'],
  ['world', 'Solar System worlds'],
  ['system', 'Extrasolar systems'],
  ['mission', 'Missions & telescopes'],
  ['method', 'Detection methods'],
  ['math', 'No-calculator math']
];
const actions = [
  ['#practice/quick', 'Quick review', 'Start a short mixed question review.', '?'],
  ['#practice/recall', 'Recall cards', 'Recall an answer, then compare and self-rate.', '↻'],
  ['#practice/simulation', 'Timed simulation', 'Open the 50-minute practice simulation.', '◷'],
  ['#labs', 'Observation labs', 'Explore the interactive study models.', '⌁']
];

function searchHint(lessons) {
  return `<p class="small muted">${lessons.length ? `Search all ${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'} by title or content.` : 'No lessons available in the library.'}</p>`;
}

export function bindHome(root, data) {
  const form = root.querySelector('#home-search-form');
  const input = root.querySelector('#home-search');
  const results = root.querySelector('#home-search-results');
  if (!form || !input || !results) return;
  function search() {
    const term = input.value.trim().toLowerCase();
    if (!term || !data.lessons.length) {
      results.innerHTML = searchHint(data.lessons);
      return;
    }
    const matches = data.lessons.filter(lesson => JSON.stringify(lesson).toLowerCase().includes(term));
    results.innerHTML = matches.length
      ? `<p class="small muted">${matches.length} ${matches.length === 1 ? 'lesson' : 'lessons'} found</p><ul>${matches.map(lesson => `<li><a href="#lesson/${esc(lesson.id)}">${esc(lesson.title)}</a><p class="small muted">${esc(lesson.summary)}</p></li>`).join('')}</ul>`
      : '<p class="muted">No lessons match. Try another word or topic.</p>';
  }
  input.addEventListener('input', search);
  form.addEventListener('submit', event => { event.preventDefault(); search(); });
}

export function homeHTML(data, state, now = Date.now()) {
  const next = currentSchedule(data, state).find(m => m.mode && completion(state, m.week) < 4);
  const continueHref = next ? `#mission/${next.week}` : '#library';
  // Written self-assessments have correct:null; retain historical MCQ attempts.
  const graded = state.attempts.filter(attempt => typeof attempt.correct === 'boolean');
  const accuracy = graded.length ? `${Math.round(100 * graded.filter(attempt => attempt.correct).length / graded.length)}%` : '—';
  const due = data.questions.filter(question => state.recall[question.id]?.due <= now).length;
  return `<div class="home-dashboard">
    <section class="home-hero" aria-labelledby="home-title">
      <div class="hero-copy">
        <p class="eyebrow">YOUR STUDY DASHBOARD</p>
        <h1 id="home-title">Welcome to your Solar System fieldbook.</h1>
        <p>Read, practice, and keep your evidence together. Choose where to begin today.</p>
        <a class="button" href="${esc(continueHref)}">${next ? 'Continue studying' : 'Explore the library'} →</a>
      </div>
      <svg class="hero-orbit" viewBox="0 0 300 220" aria-hidden="true" focusable="false" fill="none" stroke="currentColor">
        <ellipse cx="150" cy="110" rx="130" ry="65" transform="rotate(-25 150 110)"/>
        <ellipse cx="150" cy="110" rx="95" ry="45" transform="rotate(25 150 110)"/>
        <circle cx="150" cy="110" r="20"/><circle cx="257" cy="49" r="8"/><circle cx="77" cy="141" r="5"/>
      </svg>
    </section>
    <dl class="dashboard-stats" aria-label="Your study statistics">
      <div class="dashboard-stat"><dt class="stat-label">Lessons available</dt><dd class="stat-value">${data.lessons.length}</dd><dd class="small muted">Across the field library</dd></div>
      <div class="dashboard-stat"><dt class="stat-label">MCQ accuracy</dt><dd class="stat-value">${accuracy}</dd><dd class="small muted">${graded.length ? `${graded.length} graded ${graded.length === 1 ? 'attempt' : 'attempts'}` : 'No graded attempts yet'} · excludes written self-ratings</dd></div>
      <div class="dashboard-stat"><dt class="stat-label">Recall due</dt><dd class="stat-value">${due}</dd><dd class="small muted">Practiced items ready to revisit</dd></div>
    </dl>
    <section class="panel dashboard-search" aria-labelledby="home-search-title">
      <h2 id="home-search-title">Find your next lesson</h2>
      <form id="home-search-form" role="search">
        <label for="home-search">Search the whole field library</label>
        <input id="home-search" name="q" type="search" placeholder="Search a world, instrument, or idea" aria-controls="home-search-results" autocomplete="off">
        <button class="secondary" type="submit">Search lessons</button>
      </form>
      <div id="home-search-results" class="home-search-results" aria-live="polite">${searchHint(data.lessons)}</div>
    </section>
    <section aria-labelledby="quick-actions-title">
      <div class="section-heading"><h2 id="quick-actions-title">Choose your next step</h2></div>
      <div class="quick-actions">${actions.map(([href, title, description, icon]) => `<a class="action-card" href="${href}"><span class="action-icon" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${description}</p></a>`).join('')}</div>
    </section>
    <section aria-labelledby="collections-title">
      <div class="section-heading"><h2 id="collections-title">Curriculum collections</h2><a href="#library">Browse all lessons →</a></div>
      <div class="collection-grid">${collections.map(([category, title], i) => {
        const count = data.lessons.filter(lesson => lesson.category === category).length;
        return `<a class="collection-card" href="#library/${category}"><span class="collection-number" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><h3>${title}</h3><p class="muted">${count} ${count === 1 ? 'lesson' : 'lessons'}</p></a>`;
      }).join('')}</div>
    </section>
    <div class="home-bottom">
      <section class="panel continue-card" aria-labelledby="next-mission-title">
        <p class="eyebrow">KEEP GOING</p><h2 id="next-mission-title">Next mission</h2>
        ${next ? `<h3>${esc(next.topic)}</h3><p class="small muted">Mission ${esc(next.week)} · ${esc(next.date || 'Date not supplied')} · <span class="badge">${esc(next.mode)}</span></p><p>${completion(state, next.week)} of 4 steps recorded</p><a href="${esc(continueHref)}">Open mission →</a>` : '<p>No incomplete supplied missions. Choose a lesson to revisit.</p><a href="#library">Open the library →</a>'}
      </section>
      <section class="panel" aria-labelledby="routine-title">
        <h2 id="routine-title">Your weekly routine</h2>
        ${(data.schedule.routine || []).length ? `<ol>${data.schedule.routine.map(step => `<li>${esc(step)}</li>`).join('')}</ol>` : '<p class="muted">No weekly routine supplied.</p>'}
        <a class="button secondary" href="#missions">View mission log →</a>
      </section>
    </div>
  </div>`;
}
