# Team mentor dashboard verification

## Implemented

- Real `#mentor` page with owner-only sidebar and account-dialog links.
- Live Supabase roster of confirmed, nonanonymous, nondeleted accounts that have actually signed in, including the mentor. Guests and never-signed-in accounts are excluded. This is explicitly a single-team app: there is no class-code enrollment filter.
- Email, creation/sign-in/sync timestamps, self-marked weekly routine totals and practice/MCQ counts only. No private notes, reflections, written answers, raw fieldbooks, metadata or credentials are returned.
- Fifty-account pagination with exact server totals, refresh, error/empty/loading distinction, unavailable-progress labels, escaped identities, mobile table scrolling and sensitive DOM cleanup.
- Owner authorization is enforced on each RPC. Student direct-route access cannot request the roster through the app, and the backend denies unauthorized calls independently of the UI.
- Entry/account notices disclose what the mentor can see. No roster browser storage or service-worker data caching.

## Executed verification

- **174 automated tests passed, 0 failed, 0 skipped.** Build/content/syntax checks and `git diff --check` passed.
- Dashboard component: 46 tests covering paging, response validation, escaping, unavailable progress, request races, cleanup and authorization errors. App integration verifies discoverability, owner rows, student route denial and signout cleanup.
- `tests/mentor-roster-live.sql` passed against the actual database after the final SQL correction: owner access, student/guest/unconfirmed/revoked denial, eligibility and totals, pagination/limits, MCQ-versus-written counts, malformed nested progress, omission of private sentinel data and unchanged direct fieldbook RLS.
- Live metadata readback confirmed SECURITY DEFINER roster with empty search_path, anonymous EXECUTE denied, authenticated EXECUTE permitted subject to the internal owner check, migration recorded and fieldbook RLS enabled.
- Actual owner-claim readback returned two signed-in accounts at verification time; no account identities were printed or stored in the report. This used database role/JWT-claim simulation, not a browser login.
- All SQL fixtures rolled back; separate queries confirmed zero surviving roster/sync fixture users.

## Review findings corrected

1. The inherited active-simulation account-switch deferral could let an old local account write under a new shared Supabase session. Authentication boundaries now switch immediately; account caches and saved exams remain isolated. Every cloud upload carries its source UUID, and the new SECURITY INVOKER RPC rejects a mismatch with `auth.uid()`. The unsafe legacy overload is no longer executable by authenticated clients. Live rollback checks verified mismatched identity denial, matching identity success and stale-revision rejection. DOM/controller tests verify external account changes during an exam and equal-revision cross-account writes.
2. Malformed step arrays could create inconsistent counters. The roster now summarizes only exact four-boolean step arrays. A rollback probe failed before correction (four invalid extra steps), passed afterward (zero), and the full live roster fixture passed again.

## Scope and limitations

Weekly counts describe four self-marked steps across eleven weekly routines, not assessed lesson mastery. Latest sign-in does not mean currently online. Only successfully synced account progress is visible; guest/offline work remains local. Custom SMTP remains unconfigured and the existing email-delivery restrictions still apply.

No real-browser visual QA or mailbox-delivery test was run. The local Claude QA CLI was unavailable due to missing authentication; independent read-only agent review was used instead. Cached older clients must load the downloaded update before cloud uploads resume; their local work is retained.
