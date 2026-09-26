> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

# Contribution and change tracking

## Current map maintenance rules — 26 September 2026

Keep route geometry sourced from backend waypoints and observation markers sourced from the shared dataset. Preserve the separate SVG route renderer and bounded canvas iceberg rendering, non-bubbling route clicks, isolated map stacking, and the report overlay above both map modes. Do not report visual verification solely from mocked component tests.

When changing world wrapping, test dateline-crossing routes, pan/zoom, World view, Fit route, resize and report open/close. The fixed single-world boundary experiment was reverted at the user's request because routes appeared outside the map; horizontal repetition is a known remaining limitation. Record experimental and reverted behavior separately from current behavior. Use [TESTING.md](TESTING.md) for the latest evidence; this documentation pass does not imply new test runs or commits.


Reviewed **2026-09-24**, code baseline **8bb44ea**. The existing team workflow uses main; this document does not require new branches.

## Workflow

1. Inspect git status and preserve unrelated work.
2. Read active callers as well as the edited file. Retained panels/auth/geometry/database modules may not be connected to production.
3. Maintain coordinate order, units, complete route checks, bounded workloads and observed/cached/modeled provenance.
4. Run appropriate checks from [TESTING.md](TESTING.md). Record exact pass/fail counts, dependency workarounds, mocks and checks not run. Never copy old green counts.
5. Update affected Brain sections in place, KNOWN_ISSUES status with evidence, and CHANGELOG with exact changed paths and behavior.
6. Refresh FILE_INVENTORY when files change and GIT_CHANGE_HISTORY from real commit records.
7. Review the complete diff and stage only intended paths. Commit/push only when authorized by the task.

```powershell
git status --short
git diff --name-status
git diff --stat
git diff --check
git diff --cached
git ls-files --others --exclude-standard
```

No first-party CI workflow, automatic Brain synchronization hook or recurring monitor is installed. Brain is a reviewed snapshot, not a filesystem watcher.

## Integration and evidence

When integrating teammates' work on main, use normal fast-forward/rebase workflows after preserving local changes. Do not force-push shared main or reset unrelated changes. Review deletions explicitly; UI replacement does not justify dropping safety tests or documentation.

Do not make tests green by removing failed safety assertions. Separate stale UI mocks/contracts from runtime regressions and add coverage to the active three-profile path. A successful fallback must satisfy the same geometric and provenance checks as a normal route.

Provider changes require representative schemas, finite geographic values, units, observation/forecast times, spatial/time cache validity, bounded request work and explicit unavailable states. Test with a disposable DB configured before module imports. PDF statements must derive from verified data; branding is not certification.

Keep historical records under dated headings. If an earlier “fixed” claim no longer holds, mark the issue regressed and describe current evidence. Do not reuse NAV IDs for unrelated features.

## Change record

```markdown
## YYYY-MM-DD — Concrete change

- Reference: commit or uncommitted baseline.
- Problem and resulting behavior.
- Exact files added/modified/removed/renamed.
- Validation: commands, results, fixtures, failures, limitations.
- API/data/config migration and scoped rollback.
- Brain references and issue IDs updated.
```

Current verification is intentionally not duplicated here; [TESTING.md](TESTING.md) is the authoritative snapshot.
