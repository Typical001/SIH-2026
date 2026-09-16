# Contribution and change-tracking workflow

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
