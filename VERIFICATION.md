# Verification record

## Executed on 2026-11-08

Project: repository root (`solar-system-study-app/`).

| Check | Actual result |
|---|---|
| `npm run build` | Passed; generated content-derived cache and coverage report |
| `npm test` | **61 tests passed, 0 failed**, including Vercel static-output and upload-boundary contracts |
| `npm run check` | Passed; 41 lessons, 84 original questions, 14 exact B55 clause IDs |
| Exact named lists vs original curriculum | 9 worlds, 3 extrasolar systems, 4 methods, 16 missions/telescopes; no substitutions/additions |
| Numeric question checks | 19 explicit numeric keys independently recomputed; lesson worked arithmetic tested |
| Actual lesson/question/mission rendering | All render in Node/LinkeDOM; lesson cross-links and label targets resolve; no duplicate DOM IDs |
| Actual question grading | Each MCQ option checked against its key; written responses remain ungraded until self-rating |
| Model math | Central/grazing/missed/backside transit, recurrence, orbital geometry, inverse-square and equilibrium cases pass |
| Model UI | Both models execute through controls; 801 transit table rows, plots and radiation updates checked |
| Storage | Round trips, schema bounds, malformed/future imports, unsafe structures, quota errors, preserved corrupt originals pass |
| Exam integration | Timer ownership, reload/expiry, skip-link regression, hidden answer controls, full-state recovery export, stale imported options pass |
| Color calculations | Text ≥4.5:1 across defined surfaces; essential control boundaries ≥3:1 in both themes |
| Service worker | Generated worker executed in Node VM; real-asset offline navigation, namespace cleanup and byte-derived cache version pass |
| HTTP smoke test | **27 public assets HTTP 200**, every served byte matches disk on `https://orbital-fieldbook.vercel.app/`; JavaScript/CSS/JSON MIME assertions pass |
| Vercel response headers | Production `/` returns 200 with `nosniff`, `no-referrer`, `DENY` frame policy and revalidating cache; `/sw.js` returns 200 with `no-cache` |
| Private-path HTTP probes | Four representative private/nonpublic paths return **404** |
| Protected original hashes | Five original files unchanged (private handbook, two source PDFs, reference app's two uncommitted UI files) |
| Reference git state | Still exactly ` M index.html` and `?? css/modern-test.css`; no checkout/reset/write performed |
| Runtime dependency audit | `npm audit --omit=dev`: 0 vulnerabilities; no runtime npm dependencies |

`BUILD_REPORT.json` contains the exact precache inventory/version and derived content totals. `HTTP_VERIFICATION.json` contains per-asset HTTP status, MIME type, byte size and check timestamp. `COVERAGE.md` lists exact clause → lesson IDs → question IDs.

## TDD and review findings fixed

- Tested small pure-core slices RED → GREEN before subsequent behavior.
- Added source/schema tests before content files existed.
- Fixed orphaned simulation intervals and skip-link teardown; regression tests execute real view code, not just source-pattern checks.
- Preserved failed-save error notifications through backup imports and written/recall self-assessment.
- Made full backup available during an active simulation without revealing answers.
- Autosaved mission drafts before navigation.
- Blocked autosaves over malformed/unread old state until explicit recovery confirmation.
- Treated stale imported MCQ indexes as unanswered rather than crashing automatic timeout submission.
- Added actual original morphology imagery and a transit graph with text-table equivalents; checked plotted minima against the question data and key.
- Numbered source lists correspond to lesson-local citation markers.
- Distinguished essential form boundaries from lower-contrast decorative divider colors.
- Independent UI and science/assessment reviews completed. The science reviewer read all 41 lessons and 84 questions, recomputed all 19 numeric keys and found no incorrect MCQ indexes or numeric answers. This is an AI review, not official approval or a human mentor's sign-off.
- Corrected the incomplete 67P isotope discussion using the fetched NASA reanalysis; excluded RV sampling aliases; required direct growth/reproduction evidence rather than metabolism alone.
- Added fetched claim-specific technical sources for all four detection methods, Ganymede's auroral comparison and inverse-square dilution; associated questions cite the same sources.
- Follow-up assessment review identified two prompt/rubric alignment gaps. The equilibrium question now asks every graded task; JUICE's rubric now specifies a measurement and limit for each instrument.
- Source-review scope is bounded: reviewers did not independently re-fetch every bibliography page. Successful retrieval, science review and current-rule approval remain distinct statuses.

## What is NOT claimed verified

- **No browser automation was run.** Node/LinkeDOM is not a layout engine or complete browser. Real desktop/phone appearance, screen-reader/keyboard usability, native PWA installation, actual offline/update behavior, and system print pagination still require the README manual checklist.
- Four-face print geometry and overflow logic exist, but no physical duplex printout or real print-preview screenshot was inspected.
- Official corrections/clarifications returned HTTP 403 in this build. The prior dossier check is not substituted for a fresh successful check. All lessons retain `pending_rules_review`.
- Weeks 7–11, Hub logistics and an exact January deadline remain unsupplied, not inferred.
- Automated schema/key checks are not a guarantee of tournament performance or independent human science approval. Sources and written rubrics remain available for mentor review.
- No private pack questions/keys, OCR, scans, original PDFs/DOCX or official rule copy are shipped.
- The production site is deployed at `https://orbital-fieldbook.vercel.app/`; GitHub `main` triggers Vercel production builds. No paid external API, telemetry, or synchronization was performed.

## Local running artifact

Started with `./start.command`, bound only to **127.0.0.1:4173**. HTTP content verified after startup. If the agent's session cleanup stops it, run the README start command again.
