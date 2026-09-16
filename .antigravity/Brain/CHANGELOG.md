# Project changelog

Application root: `.antigravity`. This file records verified changes and is maintained according to [CONTRIBUTING.md](CONTRIBUTING.md). Git history before this documentation pass ends at `da69f5f`. Historical entries describe what Git proves; they do not reconstruct development sessions that were never committed separately.

## 2026-09-14 — Reconcile Brain documentation with current local code (uncommitted)

### Modified

- `Brain/README.md`: distinguish committed baseline from local fixes; summarize current tests and open work.
- `Brain/PROJECT_OVERVIEW.md`: include the frontend testing stack.
- `Brain/TESTING.md`: separate original baseline evidence from current verification; correct the stale absence-of-test-script claim.
- `Brain/KNOWN_ISSUES.md`: clarify review scope and remove completed fixes from the remaining-work sequence.
- `Brain/FILE_INVENTORY.md`: refresh physical counts and main file-role table; include both added test files and current telemetry behavior.
- `Brain/GIT_CHANGE_HISTORY.md`: explicitly exclude uncommitted NAV changes from committed history.
- `Brain/CONTRIBUTING.md`: clarify path conventions and how to keep primary tables and validation summaries current.
- `Brain/CHANGELOG.md`: record this review.

### Added / removed

No files added or removed. Application source, configuration and existing local fixes were left unchanged. All eleven Brain documents were reread; architecture, API and development behavior were checked against current source without requiring edits to those three files.

### Validation

3 original backend checks, 5 backend no-route checks and 14 frontend component tests passed again. Markdown links/source references were checked. No new build, browser test, audit, commit, push or deployment was performed. The earlier recorded diagnostic findings NAV-18 through NAV-23 remain open; those diagnostics were not rerun in this documentation-only review.

## 2026-09-14 — Reject failed pathfinding without a fabricated route (NAV-02, uncommitted)

### Added

- `backend/test_no_route.py`: five engine and in-process HTTP regression tests using unittest and the FastAPI ASGI app.

### Modified

- `backend/pathfinder.py`: introduces NoRouteFoundError; translates NetworkXNoPath/NodeNotFound into that exception before success metrics can be calculated.
- `backend/main.py`: maps that exception to HTTP 409 with detail.code=NO_ROUTE_FOUND; documents the response in OpenAPI.
- `frontend/src/App.jsx`: handles that status/code with a specific message; respects cancellation and retains empty results.
- `frontend/src/App.test.jsx`: adds no-route recovery, stale no-route suppression and unrelated-409 regressions.
- `Brain/API_REFERENCE.md`, `Brain/ARCHITECTURE.md`, `Brain/PROJECT_OVERVIEW.md`, `Brain/DEVELOPMENT.md`, `Brain/KNOWN_ISSUES.md`, `Brain/TESTING.md`, `Brain/FILE_INVENTORY.md`, `Brain/CHANGELOG.md`: document contract, behavior and evidence.

### Removed

Removed the inline 25-point synthetic fallback route. No files removed.

### Validation and compatibility

Five new backend tests plus all three original tests passed; all 14 frontend tests and production build passed; diff whitespace check passed. Success payloads unchanged. No-route is now HTTP 409 instead of false HTTP 200 success; API clients must handle that error code. No new dependencies. Deploy backend/frontend together. No commit, push or deployment performed. Rollback requires reverting this step's engine/API/frontend/test changes and documentation; doing so would restore the known false-success behavior.

## 2026-09-14 — Display backend errors and remove sample telemetry (NAV-06, uncommitted)

### Modified

- `frontend/src/App.jsx`: visible error alert and Retry; clear previous geometry/icebergs/metrics at request start; reject basic unusable payloads; replace misleading offline-simulation error text.
- `frontend/src/components/TelemetrySidebar.jsx`: remove fallback fixture metrics; show loading/no-results state; change sidebar badge from LIVE to RESULTS.
- `frontend/src/components/RouteComparisonModal.jsx`: show an unavailable dialog without metrics instead of a comparison populated with defaults.
- `frontend/src/App.test.jsx`: use actual telemetry/report components and add five error/recovery cases (11 total tests).
- `Brain/ARCHITECTURE.md`, `Brain/PROJECT_OVERVIEW.md`, `Brain/DEVELOPMENT.md`, `Brain/KNOWN_ISSUES.md`, `Brain/TESTING.md`, `Brain/FILE_INVENTORY.md`, `Brain/CHANGELOG.md`: document current behavior and validation.

### Added / removed

No files added or removed. Removed the inline sample telemetry fixture; ignored frontend build output regenerated.

### Validation and compatibility

11 component tests and production build pass; diff whitespace check passes. Prior NAV-01 request cancellation protections retained. API unchanged; response guard is intentionally minimal, not full schema validation. Previous results now clear rather than persist during recalculation/failure. Other static claims and baseline comparison issues remain open. No live/browser test, commit, push or deployment. Rollback by reverting this step's App/sidebar/modal/test edits and updating these records while retaining NAV-01.

## 2026-09-14 — Fix repeated route requests (NAV-01, uncommitted)

### Added

- `frontend/src/App.test.jsx`: six component regression tests for request lifecycle behavior.

### Modified

- `frontend/src/App.jsx`: scalar coordinate dependencies replace render-created object dependencies; added cancellation, cleanup and stale-state protection.
- `frontend/package.json`, `frontend/package-lock.json`: added `npm test`, Vitest 4.1.11 and React Test Renderer 18.3.1 as development dependencies.
- `Brain/PROJECT_OVERVIEW.md`, `Brain/ARCHITECTURE.md`, `Brain/DEVELOPMENT.md`, `Brain/KNOWN_ISSUES.md`, `Brain/TESTING.md`, `Brain/FILE_INVENTORY.md`, `Brain/CHANGELOG.md`: updated request behavior, issue status, tests and inventory.

### Removed

None. Build regenerated ignored `frontend/dist` assets.

### Validation

Six component tests passed; production build passed; `git diff --check` passed. Tests cover unrelated rerenders, settings, equivalent coordinate objects, refresh, stale results, loading ownership, failure and unmount/remount. No browser integration test or backend changes. See TESTING.md for toolchain warnings and environment.

### Compatibility and rollback

API unchanged. Parameter changes and manual refresh still fetch immediately; no debounce added. Development StrictMode can start and cancel an initial request; abort does not guarantee backend cancellation. Other prototype issues remain open. No commit, push or deployment performed. Rollback: revert App/manifest/lockfile changes, remove App.test.jsx and update these records.

## 2026-09-14 — Documentation moved into Brain (uncommitted)

### Renamed / moved

All eleven documentation files moved from the application root into `Brain/`, retaining their filenames: `README.md`, `PROJECT_OVERVIEW.md`, `ARCHITECTURE.md`, `API_REFERENCE.md`, `DEVELOPMENT.md`, `TESTING.md`, `KNOWN_ISSUES.md`, `CHANGELOG.md`, `CONTRIBUTING.md`, `FILE_INVENTORY.md`, and `GIT_CHANGE_HISTORY.md`.

### Modified

- `Brain/README.md`: clarified documentation location and application-root path conventions.
- `Brain/FILE_INVENTORY.md`: clarified the current documentation location.
- `Brain/CHANGELOG.md`: recorded this move. Earlier entries retain paths as they were at the time; documentation rollback paths now have the `Brain/` prefix.

### Validation

All eleven files are present in `Brain/`, none remain at the application root, and local Markdown links resolve. Application code and configuration remain unchanged.

## 2026-09-14 — Project documentation baseline (uncommitted)

### Added

- `README.md`: documentation entry point and project maturity statement.
- `PROJECT_OVERVIEW.md`: scope, features, user workflow and stack.
- `ARCHITECTURE.md`: components, data flow, equations and coordinate conventions.
- `API_REFERENCE.md`: endpoint/query/response reference and limitations.
- `DEVELOPMENT.md`: setup, configuration, build, deployment and troubleshooting.
- `TESTING.md`: existing coverage, observed check results and proposed verification.
- `KNOWN_ISSUES.md`: prioritized source findings and acceptance criteria.
- `CONTRIBUTING.md`: ongoing additions/modifications/removals tracking workflow.
- `FILE_INVENTORY.md`: application-file roles and supporting-artifact inventory.
- `GIT_CHANGE_HISTORY.md`: dated application/configuration file history.
- `CHANGELOG.md`: this project-level change record.

### Modified

No existing application source or configuration files were modified. The frontend validation build regenerated ignored files under `frontend/dist/`; these are generated output rather than source changes.

### Removed

None. No Git commits, deployment actions or automatic change-monitoring hooks were created.

### Validation and pre-existing working-tree state

See `TESTING.md` for build and test outcomes. Before this work, Git reported an untracked root `package-lock.json` and four untracked Python 3.14 bytecode files under `backend/__pycache__/` (data_engine, drift_engine, main and pathfinder). They were not created as documentation changes and were left untouched.

Rollback of this documentation update consists of removing only the eleven newly added Markdown files listed above. Existing project code does not depend on them.

## 2026-09-12 — Repository README (`da69f5f`)

- Added parent `README.md` with the SIH-2026 heading. Git treats it as binary-encoded text; no application code changes are shown in this commit.

## 2026-09-03 — Ignore rules (`1b67896`, `aed3252`, `444ef61`)

- Added `.antigravity/.gitignore` with `node_modules/` and `dist/`.
- Modified it twice by appending another `dist/` line each time; the duplicate patterns add no behavior.
- No application logic changes are recorded in these three commits.

## 2026-09-03 — Initial import (`9d73480`)

- Added the backend engines, API, existing test script and requirements.
- Added the React dashboard, components, styles, npm manifests and frontend build/hosting configuration.
- Added Docker/Render configuration, Node setup helper, editor configuration and bundled tooling.
- Included generated/vendor artifacts such as Python bytecode, Node tooling and Java editor extensions.

Indian port selection and the simplified land mask already exist in this initial import. There are no separate commits identifying when they were developed. [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md) lists individual first-party file statuses. No first-party source removal is recorded in the available history.
