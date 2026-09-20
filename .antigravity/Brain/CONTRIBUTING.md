# Contribution and change-tracking workflow

Updated **2026-09-19**, baseline **2cc8271** (with Frontend Login System and PDF Export features). The team collaborates directly on main; develop/feature branches are not required.

## Change workflow

1. Inspect Git status and preserve unrelated existing work.
2. Read affected modules/callers; maintain coordinate order, units, bounds, auth context, and live/cached/simulated provenance.
3. Run relevant checks in [TESTING.md](TESTING.md), recording substitutions and failures. Current frontend result is **40/40 passed** (100%); controlled backend result is **24/24 passed**.
4. Update CHANGELOG for code/config additions, modifications, removals and renames: exact paths, reason, behavior, verification and migration/rollback.
5. Update affected Brain reference sections in place, rather than appending notes beneath stale descriptions.
6. Review the full staged diff; stage intended paths explicitly.

```powershell
git status --short
git diff --name-status
git diff --stat
git diff --cached --name-status
git diff --cached
git ls-files --others --exclude-standard
```

No CI, automatic Markdown hook or recurring monitor is installed. Git is authoritative; Markdown does not watch the filesystem.

## Main-only collaboration

Start clean or preserve unfinished changes before pulling. After editing, stage specific reviewed files. Integrate teammate commits before pushing and rerun relevant checks.

```powershell
git switch main
git pull --ff-only origin main
# Edit, review, and git add specific intended paths.
git diff --cached --name-status
git diff --cached
git commit -m "Describe the actual change"
# With a clean working tree, integrate new remote work.
git pull --rebase origin main
git push origin main
```

Resolve rebase conflicts, stage those files and run git rebase --continue, then verify. For missing upstream, use git push --set-upstream origin main. Do not force-push shared main.

## AI-assisted changes and deletions

Review all staged D entries. Replacing UI components does not justify deleting Brain/tests. Restore accidental deletions from a known good commit using only needed paths, inspect the diff and commit the restoration; avoid whole-repository resets.

Restored files must match dependencies and behavior. New PDF export features should use `PolarNav Engine` branding and maintain actual route data bindings. Provider changes can likewise invalidate fixed-model test assumptions. Separate engine fixtures from provider integration tests; retain meaningful assertions.

New data work needs schema/units validation, observation timestamps, source propagation, spatial/time cache bounds, bounded network work and explicit outage contracts. Configured URLs and health strings are not verified feed results.

## Change record template

```markdown
## YYYY-MM-DD — Concrete change

- Reference: commit/issue or uncommitted.
- Reason and behavior: trigger and resulting behavior.

### Added / modified / removed / renamed

- exact/path: purpose, reason and replacement if applicable.

### Validation and impact

- Commands/results, substitutions, failures and checks not run.
- API/configuration compatibility, migration and scoped rollback.
- Documentation updated and issues resolved or remaining.
```

Paths are application-relative unless marked Git-root-relative; docs use Brain/. Refresh FILE_INVENTORY when structure changes, GIT_CHANGE_HISTORY from actual commits, and KNOWN_ISSUES when verified status changes. Keep prior evidence under dated historical headings. Do not edit vendor changelogs for application work.
