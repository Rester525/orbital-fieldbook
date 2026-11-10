# Automatic update verification

## Behavior

- Checks for a new service worker on startup, reconnect, foreground return and every five minutes while visible.
- Applies a fully downloaded update after ten quiet seconds, only when the current snapshot is already durable and account sync is not pending.
- Defers during active exams/practice, focused controls, visible edited fields, open dialogs, login operations, corrupt/unread storage, cross-tab changes and sync conflicts.
- Handles each tab's controller change safely; initial installation does not reload. Reloads at most once per page lifetime.
- Uses a one-use, tab-local sessionStorage marker to preserve explicitly chosen guest mode through an automatic reload. No credentials are stored by this mechanism.
- Keeps an Update now fallback with the same safety/durability checks.

## Executed verification

- Build, full test suite, content check and git whitespace check passed.
- **201 tests passed; 0 failed; 0 skipped.**
- Actual app/LinkeDOM integration covers guest continuation, signed-in clean update/reboot, no update-generated same-account storage writes, pending account changes, active exam, corrupt storage and failed note saves.
- Updater tests cover first installation, existing/new waiting workers, periodic/reconnect/foreground checks, offline failures, drafts, autofill, dialogs, practice and other-tab activation.
- Generated service-worker hash and offline asset tests passed; 41 public files, including the generated worker.
- Independent review identified a clean-account dirty-marker/conflict regression. New tests reproduced it before the fix. Update-time checks are now read-only snapshot comparisons, and genuine pending syncs postpone reload; both regression tests pass.

## Limits / initial transition

- No real-browser visual or install lifecycle QA was performed; lifecycle tests use injected browser APIs and the existing service-worker VM harness.
- Already-installed old code cannot adopt new update behavior until it loads this release. Use the old Load downloaded update once, or close all app tabs/windows and reopen after the update has downloaded.
- Browser suspension and offline status can delay checks; no claim of updates while the app is closed. Ongoing drafts and unresolved sync/storage problems intentionally delay reload.
