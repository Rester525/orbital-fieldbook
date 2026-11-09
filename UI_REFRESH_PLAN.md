# Reference-inspired study dashboard

## Scope
Use the current read-only Disease-Detective-2026 app (including its modern-test.css refresh) as the visual and navigation reference. Change only the Solar System app. Preserve existing lesson/question data, schedule provenance, storage keys/schema, auth/sync, exam restrictions and offline/print behavior. No deployment, remote assets or new services.

## Implementation
1. Replace the default mission-first home with a study dashboard: welcome/continue action, actual progress statistics, searchable lessons, study shortcuts and curriculum collections. Keep the full mission board on #missions and legacy #mission/N working.
2. Group the sidebar into Home, Learn, Practice and Tools, with direct collection links and real distinct filtered results. Add a keyboard-operable mobile navigation disclosure with Escape/route closing. Keep account/backup controls and honest source status.
3. Match the reference's pale blue-gray canvas, white surfaces, navy type/buttons, soft blue selected navigation and restrained accent colors. New users start in light mode; existing saved themes remain honored. Retain a complete dark theme and four-face print layout.
4. Add purposeful practice entry routes (quick review, recall, due review, simulation setup) without silently starting timed exams.

## Acceptance / risk audit
- Test actual DOM/event handlers for dashboard search, counts, escaping, shortcuts, category filters, active nav and mobile controls.
- Run all existing Node tests and content checks, including account isolation, storage recovery, timer disposal and print structure.
- Rebuild content-hashed service worker after all public changes; verify served bytes and MIME types for every public asset.
- Reference files are read-only; record initial SHA-256 hashes and confirm unchanged at completion. Existing modifications in that repo (index.html and untracked css/modern-test.css) must remain untouched.
- No new science claims or fabricated achievements/counts. Due counts must refer to current question IDs. Written ratings are never MCQ accuracy. Missing schedule rows remain missing.
- Keep essential input borders and text contrast, skip links, focus/reduced-motion support. Browser visual/mobile/screen-reader/print QA remains manual, per user's no-browser-testing preference; do not label DOM tests visual verification.
- Do not change cloud credentials, send student data or copy the reference's epidemiology assets/content. No paid QA services or auto-commits.
