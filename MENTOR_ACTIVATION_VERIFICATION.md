# Mentor activation verification

## Implemented and configured

- `supabase/migrations/20261109140917_mentor_activation.sql` applied to the configured Supabase project and read back; matching migration-history version/name verified.
- The owner-selected activation code was provisioned separately as a bcrypt hash. Readback confirmed the supplied code matches, activation is enabled, no expiry is currently set and failure counters began at zero. No real account was pre-granted a role.
- `public/js/mentor-access-ui.js` is integrated into `auth-ui.js` under the signed-in Account & sync panel. It sends the exact code to the server, clears it immediately, prevents duplicate submissions, and reads role status back before claiming active access. Account changes, stale responses and dialog closure do not retain the entered code.
- Confirmed Supabase login is required. Role grants are server-owned; anonymous, unconfirmed, banned and revoked callers cannot activate. Clients cannot read code hashes or write role records directly.
- Invalid-code limits: five failed attempts per account and thirty globally per 15-minute window, serialized by database row locks. Failure replies return normally so counters commit; revoked users cannot restore their role with a new code. Hash rotation/disable/expiry are separate from account-role revocation.

## Executed checks

- Final build, content/syntax checks and `git diff --check`: passed.
- Final Node/LinkeDOM suite: **139 passed, 0 failed, 0 skipped**. Full output: `MENTOR_ACTIVATION_TEST_OUTPUT.txt`.
- Live Postgres assertions in `tests/mentor-activation-live.sql`: correct activation and role readback, invalid code, anonymous denial, unconfirmed account denial, direct role-write denial, secret-read denial, forged user metadata ignored, per-user and aggregate throttles, recovery after cooldown, revocation, expiry and disabled activation all passed.
- SQL fixtures were enclosed in a rollback transaction. A separate readback confirmed zero remaining test users, zero mentor grants and zero attempt rows after testing.
- Readback verified all three new tables have RLS enabled; authenticated and anonymous clients have no direct table SELECT/INSERT privileges. Both RPCs are SECURITY DEFINER with empty search_path, executable by authenticated but not anonymous clients.
- Live HTTP requests with the public browser key and no session: both RPC endpoints and both tested private tables returned **401 / 42501** rather than data.
- HTTP smoke at `http://127.0.0.1:4173/`: all **36** public assets match local bytes/MIME; four private-path probes return 404; five protected originals unchanged.
- Offline cache rebuilt: `54b6e460d5e169b0`, 35 precached assets. Cache-byte and worker behavior tests passed.
- Plaintext-code scan: no occurrence in public assets, tracked migration sources or tests.

## Scope and limitations

The database change is live. The account-dialog change is local and has **not been deployed to Vercel**. Verification used actual database roles/JWT-claim simulation, anonymous HTTP requests and Node DOM events—not a real-browser login/activation flow or mailbox confirmation test. No browser automation was performed.

This release activates a mentor **role only**. The full classroom roster/dashboard, private student class codes, visual lesson player, expanded bank and assessed weekly completion remain unimplemented. Existing private fieldbook RLS is unchanged; granting a mentor role does not expose other students' saved data.

A short shared activation code is weak compared with individual invitation/allowlist enrollment. Anyone with a confirmed account who learns it can activate the role; rate limiting does not prevent intentional sharing. Aggregate throttling can temporarily block legitimate activation during abuse. Replace the temporary code before a wider rollout. No secret is stored in this report or repository.
