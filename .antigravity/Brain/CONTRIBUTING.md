# Contribution and change-tracking workflow

Updated 2026-09-17 for the main-only team workflow and the dccfa3b review. The team has chosen to collaborate directly on main; develop/feature branches are not required by this project.

## Required record for each change

For every addition, modification, removal or rename of application code/configuration, update `CHANGELOG.md` in the same change set. Record the exact application-root-relative paths, reason, behavioral impact, validation and any migration/rollback steps. Documentation paths use the `Brain/` prefix. Update architecture/API/setup documentation when the corresponding behavior changes. Keep unresolved work in `KNOWN_ISSUES.md` until implementation and validation are complete.

Markdown does not watch the filesystem. This is a contributor workflow; Git remains the authoritative source of actual diffs. No automatic hook or recurring monitor was installed.

Copy this template into the changelog:

```markdown
## YYYY-MM-DD — Short description

- Reference: issue/PR/commit, or “uncommitted”.
- Reason and behavior: what triggered the work and what users now experience.

### Added
- `path`: purpose. (Use “None” if empty.)

### Modified
- `path`: old behavior → new behavior and why.

### Removed
- `path`: why removed; replacement or migration if applicable.

### Renamed
- `old/path` → `new/path`: reason, if applicable.

### Validation and impact
- Commands/results, tests not run and reasons.
- Compatibility/configuration changes and rollback instructions.
- Documentation updated and known issues resolved or remaining.
```

## Before finishing a change

1. Inspect `git status --short` before work and distinguish pre-existing files from your edits.
2. Read affected source and keep coordinate order, units, simulated-data status and query defaults consistent.
3. Run the relevant checks in `TESTING.md`; never claim a passing build proves route safety.
4. Update the change record and any affected reference documents.
5. Inspect unstaged and staged changes, including newly created files. Avoid sweeping in caches, extensions, credentials or unrelated user work.

From the application root, useful review commands are:

```powershell
git status --short
git diff --name-status
git diff --stat
git diff --cached --name-status
git ls-files --others --exclude-standard
```

Use Git `A`, `M`, `D` and `R` statuses for additions, modifications, removals and renames. Untracked files do not appear in `git diff`. When publishing a release, add a release identifier/date to its changelog entries; do not invent older changes whose timing cannot be recovered from Git.

Refresh `FILE_INVENTORY.md` when project structure changes, including its main file-role table; do not rely only on appended update notes. Separate historical test results from current results and distinguish the committed baseline from uncommitted fixes. `GIT_CHANGE_HISTORY.md` is a dated historical snapshot and should be regenerated or extended deliberately, not treated as a live log. Do not edit vendor changelogs to record application work.

## Main-only collaboration

Start work with a clean working tree on main and update it from origin. Commit intended source/document changes explicitly. Incorporate teammates' commits before pushing; resolve conflicts and rerun relevant checks after integration.

```powershell
git switch main
git pull --ff-only origin main
# Make changes, inspect diffs, and stage specific intended files.
git diff --cached --name-status
git diff --cached
# Commit the reviewed changes, then integrate any new remote commits.
git pull --rebase origin main
git push origin main
```

The second pull assumes the changes were committed and the working tree is clean. If rebasing produces conflicts, resolve and stage those files, run git rebase --continue, and verify the combined result before pushing. For an upstream not yet configured, use git push --set-upstream origin main. Do not force-push shared main. Commit or stash unfinished work before pulling; generated environments/caches should not be staged as application changes.

## Review AI-assisted changes and deletions

- Inspect all D entries in git diff --cached --name-status. A UI redesign can intentionally replace a component, but it does not justify deleting project documentation, tests or request/error handling.
- Confirm new components are mounted and old imports removed. In the current design, LeftControls and DecisionSupport replace ControlDeck and TelemetrySidebar; StatusBar is unused.
- Restore accidental deletions from a known good commit with a narrowly scoped path, then inspect the diff and commit the restoration. Do not reset the whole repository to recover a few files.
- Restoration of files does not restore their dependencies or implementation. dccfa3b recovered Brain and two test files; it did not recover NoRouteFoundError, HTTP 409, request guards, honest empty states, npm test or testing dependencies.
- A working build does not execute App.test.jsx. Record missing scripts/import failures explicitly and retain historical pass results only under dated historical headings.
- New functionality such as xai_explanation requires API/architecture documentation and tests for unavailable or synthetic evidence, not only a UI label.

## Required documentation updates

Update all affected sections in place, not only by appending a dated note below a stale description. README and PROJECT_OVERVIEW must match current features; ARCHITECTURE and API_REFERENCE must describe actual runtime behavior; DEVELOPMENT and TESTING must distinguish executable setup from known failures; KNOWN_ISSUES must reopen regressions; FILE_INVENTORY and GIT_CHANGE_HISTORY must distinguish existing, removed and restored files. Record the exact changes and verification in CHANGELOG.

For each future source change, run the original backend checks, the no-route suite once restored, updated frontend regressions and the production build as applicable. Current failures are documented in [TESTING.md](TESTING.md); do not silently claim they pass or delete the assertions. There is no CI or automatic Markdown synchronization configured.
