# Signup names verification

- Create account opens the Name / Email / Password signup view without submitting or validating the login form. The guest account dialog opens the same screen.
- Signup trims and validates the name and sends only `options.data.display_name` to Supabase Auth. Sign-in remains email/password. Names are display-only, never authorization.
- Existing nameless accounts remain usable; the mentor roster falls back to email. Names render as escaped text alongside email.
- Guest storage remains unchanged when opening signup; existing confirmation, password reset, account isolation and guest paths remain covered.

## Executed checks

- `npm run build`, `npm test`, `npm run check`, `git diff --check`: passed. 181 tests passed; 0 failed; 0 skipped.
- Observed red/green tests for name payload, name validation, signup navigation and malformed roster names.
- Live SQL name assertion failed before migration, then `tests/mentor-names-live.sql` passed after migration, with all fixtures rolled back.
- Readback verified exact live roster function body matches the local migration (MD5 `5d731b99a14777139f463db9497d3005`), restricted search path, authenticated-only execution, one migration record and zero leftover test accounts.
- Existing designated owner remained active; no real user's metadata was modified.

## Verification limits

No browser visual QA or actual confirmation-mail delivery test was performed. Supabase's previously documented default-mailer restrictions still apply. Existing accounts do not automatically acquire names; this change collects names during new signup.
