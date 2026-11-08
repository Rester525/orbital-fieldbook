# Orbital Fieldbook implementation plan

**Goal:** A local-first Solar System B 2026–27 study app organized around the user's 11 missions, not a generic astronomy landing page.
**Architecture:** Dependency-free ES modules, static JSON content, semantic HTML/CSS, original SVG diagrams, localStorage with validated versioned backups. Only `public/` is served or later deployed. Original documents and source research remain outside that directory.
**Stack:** HTML, CSS, JavaScript; Node built-in test runner; Python standard-library localhost server. No accounts, remote runtime assets, telemetry, paid APIs, database or deployment.

## Inspection and decisions
- Read dossier, exact curriculum, dated schedule, packet/resource/slide inventories, original handbook, historical slide text, starter-pack metadata and representative framing page. The pack has 151 image-only pages; questions/keys are not imported or relied on.
- Visually confirmed screenshot rows 1–6, dates and LIVE/SELF labels. Year 2026 remains contextual. Rows 7–11 are absent. No exact January deadline.
- Inspected reference README, HTML, home dashboard, quiz core, cases, drills, tools, notes, manifest and service worker. Reuse the navigation → study → practice → progress pattern, not source code/content. Its uncommitted files remain untouched.
- Live official corrections/clarification retrieval on 2026-11-08 returned HTTP 403. Search results do not establish absence of corrections. All scope badges will say **B55 mapped · update check pending**, with `pending_rules_review`, until a successful current update check. Dossier's prior successful check is attributed, not passed off as this build's check.

## Design plan and critique
Observatory fieldbook: midnight blue #102438, instrument blue #255878, glacial cyan #73d6df, warm signal amber #ffd18a, chalk #edf3f6, slate #52677a. System sans for reading, condensed system headings and monospace telemetry; no font downloads. A vertical numbered mission rail (actual sequential weeks) is the signature. Large mission titles, compact mode/date tags, four-step checklists and a contrasting evidence panel. No starfield, decorative orbital animation, fake telemetry or 3D.
Desktop has a narrow navigation column, wide mission board and progress summary. Mobile stacks the mission rail with visible text navigation. Light/dark tokens, focus outlines, reduced-motion override, native form controls, chart table equivalents. Critique: replace generic dashboard stat tiles with the actual dated learning sequence; statistics remain secondary.

## Files and contracts
All paths below are relative to this repository's root.
- `public/index.html`, `public/css/app.css`: shell, accessible navigation, responsive and print styles.
- `public/js/app.js`: data loading, routing, mission board/detail, library, sources, progress, settings.
- `public/js/practice-ui.js`: quick review, recall, written rubrics, review queue, 50-minute exam interface with all answer help/labs hidden while active.
- `public/js/labs-ui.js`: transit SVG/table and radiation SVG/table with controls, assumptions, reset and guided questions.
- `public/js/notes-ui.js`: four printable faces, editable plain text, export/import, preview and overflow checks.
- `public/js/models.js`: pure `transitCurve({starRadius,planetRadius,inclination,period,stellarMass,samples})`, `radiation({distance,luminosity,albedo})`; radii in solar radii, period days, inclination degrees, mass solar masses. Outputs samples `{time,flux}`, metadata; radiation outputs flux W/m² and temperature K.
- `public/js/storage.js`: `defaultState()`, `validateState(value)`, `loadState(storage)`, `saveState(storage,state)`, `exportState(state)`, `importState(text)`, `validateSchedule(missions)`. State schema v1: `{schemaVersion:1,missions:{},schedule:[],notes:['','','',''],attempts:[],recall:{},settings:{theme:'dark'},exam:null}`. Data validation rejects future versions, malformed/oversized input, unsafe object keys; corrupt originals preserved, storage failures surfaced.
- `public/js/quiz.js`: pure `gradeQuestion(question,answer)`, `scheduleReview(previous,quality,now)`, `selectQuestions(questions,{count,lessonIds})`, `createExam(questions,now)`, `remainingSeconds(exam,now)`. Written work is explicitly self-assessed, never fake automatic grading.
- `public/data/worlds.json`, `missions.json`, `foundations.json`: arrays of lessons. Contract: `{id,title,category,rule_refs:[exact IDs],summary,sections:[{heading,text}],evidence:{observation,instrument,inference,alternative,uncertainty},source_refs:[{url,title,locator,checked_at,status}],teach_back,scope_status,season:'2026-2027'}`. Category world/system/mission/foundation/method/math. Named titles EXACTLY match curriculum lists.
- `public/data/questions-worlds.json`, `questions-missions.json`, `questions-foundations.json`: arrays `{id,lesson_id,rule_refs,type:'mcq'|'written',prompt,options?:[strings],answer?:index,explanation,rubric?:[strings],source_refs:[same schema],difficulty,kind:'recall'|'comparison'|'data'|'reasoning'|'math',numeric_check?:{expression,expected}}`. Original authorship only. Graph/table stimuli may be `{headers,rows}`; diagrams via an allowlisted `diagram` identifier, never executable data HTML.
- `public/data/schedule.json`, `scope.json`, `resources.json`: sanitized editorial summaries, links and exact named lists only; no private paths or copied rule prose. Missing schedule entries have null date/mode and title `Not supplied`.
- `public/manifest.webmanifest`, `public/sw.js`, `public/assets/icon.svg`, local PNG icons: versioned complete allowlist precache, no remote or private fetch caching, updates wait for user reload, only own cache namespace cleaned.
- `tests/*.test.mjs`: Node math/storage/quiz/content/UI contract/SW tests. `scripts/check.mjs`: syntax, schema, named-list and clause coverage, original assets/private-file checks; `scripts/build.mjs`: validate and derive precache/hash for public-only assets.
- `package.json`, `README.md`, `SOURCE_RIGHTS.md`, `COVERAGE.md`, `VERIFICATION.md`: commands, manifest, rights and honest validation limits. `start.command`: localhost-only starter.

## Clause coverage matrix
| Exact B55 clause | Lesson(s) | Original practice | Model/tool |
|---|---|---|---|
| 1 | Event orientation / habitability | Habitability versus life | Mission board |
| 2.a–c | Event orientation / note preparation | Materials decision | Four-face notes; no-calculator exam |
| 3 intro | Reading evidence | Graph/table/diagram interpretation | Accessible plots |
| 3.a.i | All nine world profiles | Each world: explanation/evidence | Radiation comparisons |
| 3.a.ii | All three system profiles | Comparisons and limitations | Transit/radiation |
| 3.b.i | Habitability conditions | Atmosphere, liquids, tides, disequilibrium | Radiation |
| 3.b.ii | Geologic/chemical evidence | Morphology, spectra, small-body delivery | Original evidence diagrams |
| 3.b.iii | Biology and chemistry | Biomolecules, ice/brines/clathrates, extremophiles | — |
| 3.b.iv | Four method lessons | One distinct data/interpretation task per method | Transit |
| 3.b.v | All 16 named mission entries | Instrument/objective/tradeoff tasks | Cross-linked library |
| 3.b.vi(1) | Light/radiation math | Hand-solvable ratios, units, graphs | Both labs |
| 3.b.vi(2) | Gravity/orbits/tides math | Kepler, gravity, energy, escape/tides | Transit Kepler scale |
| 3.b.vi(3) | Chemistry math | Gas-law ratios, Arrhenius, equilibrium | — |
| 4.a–c | Event orientation / evidence reasoning | Written rubric quality | Honest self-assessment |

Generate final matrix with actual lesson/question IDs and assert each row has coverage. Solar System practice receives more weight than exoplanets. Handbook's 11 undated rows are separately labeled, never used to invent missions.

## Source and rights map
- Official manual B55 PDF p60 + corrections/clarifications: outbound links and original short paraphrases only; current update check pending.
- NASA/ESA scientific pages: retrieve specific pages and record headings; original synthesis with per-lesson citations. No downloaded imagery or site text distribution.
- Open educational physics/biology references as necessary for formulas and biology, with exact locators.
- Handbook and screenshot: local workflow facts, with provenance; no source document bundled.
- Starter pack: private inspection only; no scans, OCR, equations, questions or keys imported.
- Historical slides/tests: season-labeled references only; no current scope authority.
- All shipped graphics: original schematic SVG/PNG, explicitly not measured topography or real observations.

## Milestones / tests
1. Create small failing Node tests for each pure behavior, implement, run GREEN before adding next slice. Content schema tests precede authored datasets. Parallel workers own separate files.
2. Populate scientifically sourced lessons/questions; assert exact nine/three/four/sixteen lists, citations and complete clause coverage. Recompute numeric keys independently; review all MCQ keys/rubrics.
3. Implement shell/mission workflow, storage, library, progress and backups; exercise export/import, malformed data, future versions, quota errors, unknown missions, safe text rendering and SELF behavior.
4. Implement models: central transit 1% for radius ratio .1, grazing overlap, no occultation behind star, inclination miss, period recurrence; Earth-like equilibrium near 255 K, inverse-square and fourth-root scaling; reject bad inputs. Render SVG plus numerical tables.
5. Implement practice: 5/10-question reviews, recall scheduling, written answers/rubrics and 50-minute wall-clock exam that survives reload and does not reveal feedback before submission. Test timeout/reload.
6. Notes: four Letter faces representing two duplex sheets; font and overflow warnings; plaintext backups; print only faces, not navigation. Manual printer verification remains explicit.
7. Build precache from allowlisted public files and test install/fetch/activation in Node service-worker harness. HTTP-smoke every asset, imports and MIME types. Check private-file absence and unchanged reference/source hashes.
8. Independent read-only review, fix defects, rerun complete checks; write README and actual outputs. Start local server and verify HTTP responses. No browser automation, screenshots of app, publish or deployment.

## Self-audit and resolved gaps
- Science: uniform-disk geometric transit (circle overlap), circular Kepler orbit, front/back distinction; no limb darkening/noise. Radiation is full-redistribution blackbody, not surface temperature; no claim of life. Stability/atmosphere/tides explicitly omitted.
- Season: exact IDs/list names retained. Specific current scope uses pending-review badge because live corrections blocked. Planned mission objectives are not claimed achieved; avoid unstable launch-status claims.
- Schedule: five unknown entries editable/importable; user edits labeled user-authored; SELF evidence saved/exported, never falsely sent to a mentor. No date penalties.
- Security/privacy: local plaintext may contain personal study notes; do not store secrets. Import size/schema limits, safe text escaping, URL protocol allowlist, CSP, no third-party JS; backups before replacement; exam answers stored locally so not a secure proctor.
- Licensing: serve only public allowlist; private source PDFs and extracted artifacts outside project; no wholesale reference-app copying.
- Accessibility: semantic forms, focus management, visible focus, non-color status labels, table alternatives; screen-reader/keyboard/contrast visual review remains manual if not testable without browser.
- Offline: precache atomic install; explicit update/reload, own namespace only, no remote cache; failures shown, localStorage errors not silently called saved. No offline promise before first successful online cache install.
- Performance/cost: no libraries or remote assets; modest static datasets; no paid calls or deployment. Source retrieval only.
- Completeness: real lessons across all named entries; no inflated counts, placeholder nav, copied exam banks or unearned test-pass claims. Counts generated from data. Remaining source/visual uncertainties surfaced in app and docs.
