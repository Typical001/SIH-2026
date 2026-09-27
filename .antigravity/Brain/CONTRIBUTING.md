# Contribution and documentation workflow

Current as of 27 September 2026.

1. Inspect Git status and preserve unrelated work. Check active imports/callers; retained legacy files do not imply working features.
2. Separate observations from estimates; preserve units, coordinates, complete geometry checks and bounded work.
3. Protect new application endpoints and use authenticated requests. Never commit plaintext credentials, tokens or local env files.
4. Run appropriate checks from [TESTING.md](TESTING.md). Distinguish mocks, source review and browser evidence; record failures and unrun checks.
5. Update current Brain sections in place instead of appending conflicting checkpoints. Preserve old audit/status records explicitly as historical.
6. Update [issues](KNOWN_ISSUES.md), [changelog](CHANGELOG.md), [inventory](FILE_INVENTORY.md) and [Git history](GIT_CHANGE_HISTORY.md) as relevant. Derive commit claims from Git.
7. Review/stage intended paths only. Commit/push when authorized; main auto-deploys both services. Do not force-push/reset unrelated work.

```powershell
git status --short
git diff --stat
git diff --check
git diff --cached
git ls-files --others --exclude-standard
```

Map changes need route fit, pan/zoom, resize, World view, date-line and report-stacking checks. Default is a centered dark map, 33 icons, horizontal wrapping and viewport-dependent minimum zoom. Do not add fixed world bounds without route validation.

Auth/data changes require access-boundary and failure tests. A passing build is not evidence of live API, all-browser or downloaded PDF correctness. Do not remove safety assertions to obtain green tests.

Brain is maintained manually; no automatic synchronization hook, recurring monitor or exhaustive CI is implied. Historical NAV IDs remain in the archive; do not reuse them for unrelated issues.
