# Owner-only mentor access

Supersedes shared-code activation. The designated owner email is stored privately in Supabase, not in this repository. Normal confirmed sign-in is still required; the app contains no mentor code input or redemption call.

## Backend

- Migration `20261109200202_owner_only_mentor` disables the shared secret, replaces redemption with a non-granting function and revokes anonymous/authenticated execute permission.
- The private RLS-protected `mentor_owner_settings` singleton permits only the designated verified email to bind an owner UUID. Subsequent checks are UUID-bound, not browser metadata or email comparisons in JavaScript.
- Existing code grants are revoked by the migration. Revoked owner grants do not self-restore. Other users cannot read or write the designation or role tables.
- Live readback confirmed the configured designated account is verified, bound and active. Exactly one active mentor grant exists. The old code is disabled and authenticated callers cannot redeem it.
- Fieldbook privacy policies remain unchanged. This is owner-role access, not a completed classroom dashboard.

## Verification

- 122 current automated tests passed, including owner-only status, guest/account isolation, stale-response suppression and startup signup/login regressions. Retired code-redemption UI tests were replaced with owner-mode tests; prior suites covered a different feature set.
- `tests/mentor-owner-live.sql` passed against the live database: unconfirmed owner denial, confirmed owner grant/readback, nonowner and forged metadata denial, UUID binding, revoked owner denial, table privilege denial, and anonymous/authenticated retired-code denial.
- Fixtures rolled back. Separate readback confirmed zero fixture users, unchanged designated owner configuration, enabled RLS, and recorded migration version.
- Existing activation reports and `tests/mentor-activation-live.sql` are historical only; use the owner-only fixture for the current schema.
