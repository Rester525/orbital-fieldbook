# Orbital Fieldbook

A local-first, optionally cloud-synced **Solar System Division B (2026–27)** study app. Independent of Science Olympiad; not an official rulebook or tournament exam.

## Start locally

From this repository's directory:

```sh
./start.command
```

Then open **http://127.0.0.1:4173/**. Alternatively: `npm start` (Node/npm available) or `python3 -m http.server 4173 --bind 127.0.0.1 --directory public`.

Only `public/` is served. **Never serve the enclosing `Solar System` directory**, which contains private source documents. Do not open `index.html` with `file://`: module/data loading and service workers require localhost or HTTPS. No package installation is needed merely to run the static app. Progress is tied to the exact origin (host and port); localhost and 127.0.0.1 are separate storage locations.

## Requirements and expected behavior

- Home is the 11-mission board. Weeks 1–6 use the screenshot's actual dates and LIVE/SELF modes, visually confirmed in this build. The contextual year is 2026. **Week 4, Nov 29 is SELF: study and send work without a meeting.** Weeks 7–11 remain `Not supplied` with null dates/modes until the user edits them. No inferred January deadline, catch-up penalty or lockout.
- Four-step routine: read → practice → discuss → teach each other. SELF reflections save locally and can be exported as text for the user to send. **The app does not submit work to a mentor.**
- The library contains original science explanations, evidence chains, uncertainties, exact B55 clause IDs and independent source locators. The curriculum's nine worlds, three extrasolar systems, four detection methods and sixteen missions/telescopes are checked by exact names, not a loose count.
- Quick reviews use 5 or 10 items (or the smaller matching pool), with comparisons, data interpretation, reasoning, math and written rubrics. Recall ratings schedule a future review. MCQ accuracy is separate from written self-assessment; this app does not pretend to grade scientific explanations automatically.
- The approximately 50-minute simulation uses a persistent wall-clock deadline. No calculator, lab controls, hints or solution UI is available during it. Reload does not restart the clock. It is a study timer, **not secure proctoring**: question keys are present in local source files. Submit to access explanations again.
- Two meaningful SVG/table models: geometric transit light curve and flux/equilibrium-temperature explorer. Models state units, assumptions, omissions, guided questions and known cases. Simulated data are never presented as observations or proof of life.
- The notes planner has four Letter-sized faces for **two sheets, both sides**, editable plain text, an on-screen print preview, font selection and overflow checks. Print duplex/long-edge at actual size with browser headers/footers disabled. No affixed labels/annotations. Preview assistance is not a tournament-acceptance guarantee.
- Guest work is stored only on this device. **Sign in · sync** offers Supabase email/password login, email-confirmed signup, password reset, and private per-account sync. Signing in never copies guest work automatically; choose **Copy guest work to account**. Account writes save locally first, then sync online. Offline edits remain pending, with a Retry sync control. If two devices diverge, choose a cloud copy (the device copy downloads first) or explicitly confirm overwriting the cloud. Sign out returns to the separate guest work.
- Device state includes mission steps/reflections, edited schedule, notes, attempts, recall and current simulation. JSON backups are validated and versioned; future schemas are rejected. Import downloads a backup before replacing existing work. Storage errors are visible. If an existing save is unreadable, automatic saves are blocked until **Recover saved data** exports the original and you explicitly approve replacement. A corrupt account copy can be exported from **Account & sync** without overwriting it. Keep independent backups: cloud sync is not version history or a substitute for export.
- All lessons, questions, models and the Supabase browser SDK are bundled locally; external citations and signed-in sync need internet. Offline return requires a successful first cache installation. No remote fonts/JS/images, telemetry or AI calls. Supabase Auth and a private Postgres row provide optional login and sync; the project URL and publishable key are public browser configuration, never a service-role key.

## Source authority / what is official

1. **Official 2027 Division B manual, Solar System B B55 / PDF p.60**, applicable corrections/clarifications and tournament notices determine scope. The supplied research established the manual's provenance; the app stores an original clause summary and named lists, not a rule-PDF copy.
2. NASA, ESA and other specifically cited science references explain concepts; they do not expand competition scope.
3. The handbook provides local study practices (60–90 minutes, 5–10-question reviews, periodic longer sessions). Its eleven topic rows are shown as a **separate undated outline**, not silently mapped onto the screenshot.
4. The supplied 151-page image-only, draft-rule-based pack is private. Its exam-like forms/keys are not authenticated as actual tournament tests and are not imported.
5. Historical 2025–26 formation slides and older tests are labeled historical. Their dates, permissions and scope are not current rules.

**Current review limitation:** fresh attempts to fetch the official corrections/clarifications pages returned HTTP 403. A search snippet cannot establish absence of corrections. The app therefore says **B55 mapped · update check pending**, and uses `pending_rules_review`, not `rules_required`. Recheck the official pages and local tournament notices before competition. See `SOURCE_RIGHTS.md`, `NAMED_CONTENT_SOURCES.md`, `FOUNDATION_SOURCES.md` and the source cards.

## Architecture / file manifest

- `public/index.html` — semantic app shell, CSP, skip link, navigation.
- `public/css/app.css` — observatory visual system, light/dark, responsive layout, focus/reduced-motion and Letter print styles.
- `public/js/app.js` — bootstrap, data loading, route guard, themes, account integration, offline/update status.
- `public/js/auth-ui.js`, `public/js/cloud-sync.js`, `public/js/cloud-config.js` — email account dialog, per-user local-first sync/conflict controller, public project configuration.
- `public/js/view.js` — safe text escaping, external URL protocol check, shared tables/citations/downloads.
- `public/js/missions-ui.js` — mission board, editorial reading mapping, local work/export.
- `public/js/library-ui.js` — searchable lessons, evidence and citation views.
- `public/js/practice-ui.js` — quick practice, recall, written self-assessment and timed simulation.
- `public/js/labs-ui.js` — accessible SVG/model-table controls and explanations.
- `public/js/notes-ui.js` — four-face editing, import/export, preview/print.
- `public/js/dashboard-ui.js` — progress, rule/source directory, schedule and backup settings.
- `public/js/models.js` — pure transit geometry and radiation math.
- `public/js/storage.js` — schema validation, import/export, safe loading and saving.
- `public/js/quiz.js` — pure selection/grading/review scheduling/exam clock.
- `public/data/{worlds,missions,foundations}.json` — original lessons.
- `public/data/questions-{worlds,missions,foundations}.json` — original cited practice.
- `public/data/{schedule,scope,resources}.json` — sanitized source-derived workflow, scope and outbound links.
- `public/assets/icon.svg`, `icon-192.png`, `icon-512.png` — original app icons. `supabase.js` and `SUPABASE-LICENSE.txt` — bundled MIT-licensed Supabase browser client and notice.
- `public/manifest.webmanifest`, `public/sw.js` — install metadata and generated complete-asset cache.
- `scripts/check.mjs` — schemas, exact list/clause coverage, numeric keys, import/syntax/private-asset checks.
- `scripts/build.mjs` — validate, generate content-hashed precache, `COVERAGE.md` and `BUILD_REPORT.json`.
- `scripts/http-smoke.mjs` — live HTTP byte/MIME/private-path checks and protected-source hashes.
- `scripts/icons.py` — optional icon reproduction (Pillow only for this development task).
- `tests/*.test.mjs` — pure-core, data, rendering, DOM-interaction and simulated-service-worker checks.
- `package.json`, `package-lock.json` — Node scripts, bundled runtime Supabase client and test-only LinkeDOM.
- `supabase/config.toml`, `supabase/migrations/*.sql` — production auth redirects and row-level-security/revisioned-save schema; no database password is committed.
- `AUTH_PLAN.md` — security/sync implementation boundaries.
- `start.command` — localhost-only Python server.
- `vercel.json`, `.vercelignore` — static-only Vercel preset, production-only dependency install, security headers, service-worker revalidation and build-upload boundary.
- `.github/workflows/verify.yml` — Node 22 build, tests and source checks on push/PR.
- `tests/vercel.test.mjs` — deployment boundary and configuration assertions.
- `IMPLEMENTATION_PLAN.md` — pre-build plan and self-audit.
- `SOURCE_RIGHTS.md`, `NAMED_CONTENT_SOURCES.md`, `FOUNDATION_SOURCES.md` — rights/provenance and scientific review notes.
- `CORE_API.md` — pure module contracts.
- `COVERAGE.md`, `BUILD_REPORT.json`, `VERIFICATION.md`, `HTTP_VERIFICATION.json`, `VERIFICATION_TEST_OUTPUT.txt` — actual coverage and verification evidence.
- `CHANGED_FILES.md` — exact project file manifest, excluding installed dependencies.
- `SOURCE_BASELINE.json` — local-only hashes of the read-only reference/source files; ignored by git, outside public.

## Development and verification

Node 20+ and Python 3 are sufficient. Install free **development-only** dependencies for DOM tests:

```sh
npm ci
npm run build
npm test
npm run check
```

`npm run build` validates data before regenerating `public/sw.js`; update it whenever public files change. The cache version hashes filenames and bytes. Install is atomic (`cache.addAll`), only this app's origin/scope cache namespace is removed on activation, and an update waits until the user selects **Load downloaded update**. The app refuses that update during an active simulation. It never precaches source PDFs, external links or user notes.

The Node service-worker harness runs the actual generated worker against real local asset bytes with network failure and namespace-cleanup cases. Node DOM tests are not a real browser: visual layout, actual installability, printer pagination, screen-reader behavior and real browser offline/update flows still need manual QA. **No browser automation was used**, per request. Read `VERIFICATION.md` for executed results; structural assertions do not constitute human science review.

### Manual acceptance checklist

1. Open at desktop, tablet and phone sizes; test dark/light contrast, long content and keyboard focus/navigation.
2. Open a mission, record all four steps, save a reflection, reload, export it, and verify no network submission is implied.
3. Edit a missing mission, export/import the schedule; original source files must remain unchanged.
4. Check lessons' evidence/source cards, search, filters, a data question and written self-assessment.
5. Start a simulation, reload, attempt another route, submit and review; verify no help appears before submission.
6. Move every lab slider with keyboard; compare plots against tables and known cases; reset.
7. Fill four notes faces; inspect all four pages in system print preview; verify duplex produces two sheets without clipping or extra pages.
8. Wait for offline installation, close/reopen offline, then test an update after a rebuild. External sources should remain internet-only.
9. Back up, clear a test profile's site data, import, and verify restored notes/progress/schedule. Never clear the primary profile without a backup.
10. In a test profile, sign up and confirm email, sign in, copy guest work deliberately, edit a note, and verify it appears after sign-in on a second device. Test sign-out, offline pending edits and conflict choices before trusting sync.
11. Mentor-review scientific explanations/keys, provisional source flags and official updates before competition.

## Vercel deployment

Live site: **https://orbital-fieldbook.vercel.app/**. GitHub `main` is connected to Vercel's `rishi-s-projects10/orbital-fieldbook` project; pushes trigger production builds. `vercel.json` selects the Other framework, runs `npm ci --omit=dev` and `npm run build`, and serves only `public/`. `.vercelignore` excludes the local-only source baseline, test fixtures and development reports from CLI uploads. No environment variables, serverless functions, paid APIs, or rewrites are required. The build validates the original content and generates the content-hashed offline cache. Vercel's default revalidation policy for unversioned files and the explicit `sw.js` header avoid stale deploys; the service worker keeps already-installed assets available offline.

GitHub publication makes the original question bank and answer keys visible in source; this is a study tool, not a secure assessment. Guest work remains in each browser's local storage; signed-in work syncs to a private Supabase row with row-level security. The Supabase browser key is publishable, not a secret; never ship a service-role key. Different origins (localhost vs. Vercel, preview vs. production) have separate guest work and auth sessions; sign in to the same account to retrieve cloud work, or export/import a backup for guest data. Email confirmation and password-reset links return to the production site; default Supabase email delivery is rate-limited and may require custom SMTP for broader use. Only the app subdirectory is in the repository; the parent PDFs, scans, attachments and local `SOURCE_BASELINE.json` are not committed. Review official corrections and arrange mentor science review before relying on this for competition.

## Known limits

- Five dated missions and the exact January target/Hub logistics remain missing by design.
- Fresh official corrections verification was blocked; scope status is pending.
- No live science feed; rapidly changing mission status and new discoveries need source review. Objectives are not implied achievements.
- Practice is a finite original bank, not an official exam or a claim of exhaustive exam coverage.
- Written quality and recall confidence are self-assessed; no automatic essay scoring.
- Browser visual/accessibility/install/print QA is manual, not claimed passed by Node tests.
- Plain-text local backups are not encrypted. Account sync is private to the signed-in Supabase user via row-level security, but is not end-to-end encrypted. No mentor submission backend.
