# Project changelog

Application root: `.antigravity`; documentation paths use `Brain/`. Committed history now ends at `3684d67` (2026-09-17); local restoration changes below are uncommitted. Entries describe observed changes, not inferred author intent. September 14 entries retain their historical “uncommitted” status at the time; those files/fixes were subsequently committed in 6097e6c and partly regressed in c996de7.

## 2026-09-17 — Restore NAV-01/02/06 in the redesigned dashboard (uncommitted)

Baseline: clean main at 3684d67. Preserve the panel redesign, explanation dialog, drift chart and successful XAI response while restoring the three requested guarantees.

### Modified

- `backend/pathfinder.py`: restore NoRouteFoundError for disconnected/missing paths; remove interpolated fallback before success geometry, metrics or explanations.
- `backend/main.py`: map NoRouteFoundError to documented HTTP 409 / NO_ROUTE_FOUND; retain xai_explanation on success.
- `backend/test_no_route.py`: retain five cases and assert explanation presence on success/absence on failure.
- `frontend/src/App.jsx`: scalar callback dependencies, request cancellation/cleanup/ownership, stale-response guards, result/XAI clearing, minimum numeric/array validation, explicit no-route and generic alert/Retry behavior.
- `frontend/src/components/panels/DecisionSupport.jsx`: remove fallback metric fixture; display loading/empty state and unmount explanation/chart/alerts without results.
- `frontend/src/components/RouteComparisonModal.jsx`: restore unavailable dialog when results are absent.
- `frontend/src/components/Navbar.jsx`: remove misleading local-fallback/success banner; retain loading indicator and layout.
- `frontend/src/components/panels/BottomStatusBar.jsx`: show calculating/result availability, simulation mode and a correctly labeled UTC clock instead of unconditional online/safe-navigation claims.
- `frontend/src/App.test.jsx`: update controls mock and numeric fixtures, use actual Navbar/result components; retain existing assertions and add clock, partial-data, chart/XAI clearing and JSON-race coverage (20 cases).
- `frontend/package.json`, `frontend/package-lock.json`: restore npm test and exact Vitest 4.1.11 / React Test Renderer 18.3.1 development dependencies.
- All eleven `Brain/*.md` documents: update current behavior, API, setup, verification, fixed/open status, inventory and history while retaining dated diagnostic evidence.

### Added / removed / renamed

No source files added, removed or renamed. Removed inline interpolated fallback and sample metric fixture. npm install updated local ignored dependencies; build regenerated ignored frontend/dist output. Existing generated/vendor artifacts were not staged or deliberately cleaned.

### Validation and compatibility

3 original backend checks, 5 no-route engine/ASGI tests and 20 frontend component tests pass (28 total). Production build passes with 1,560 modules. Successful API response shape including xai_explanation is retained; graph failure is again HTTP 409 instead of false HTTP 200. Frontend clears previous results immediately on recalculation and shows a specific no-route message or generic error with Retry. Deploy frontend/backend together.

NAV-01/02/06 and test-infrastructure NAV-24 are fixed locally; 22 other issues remain open, with NAV-21 retired. Footer changes partially address NAV-05, but map/report safety claims remain. Guards are minimum usability validation, not a full nested schema or geographic/model correctness guarantee. Test-runner esbuild/oxc warnings remain; npm install reported two dependency advisories and no force upgrade was performed.

No browser/hosted test, isolated clean-install check, scientific validation, commit, push or deployment. Documentation consistency/links and diff whitespace are checked before completion. Rollback would require reverting only this change set and updating these records, but would restore the known regressions; no rollback was performed.

## 2026-09-17 — Commit Brain review (3684d67)

Committed the eleven updated Brain documents from the review below. No application source changed. The review's historical test failures describe the state before the current restoration.

## 2026-09-17 — Reconcile all Brain documents with dccfa3b (later committed in 3684d67)

Reason: restored documentation described September 14 behavior, while current main contains a new layout, explanations and removed safety/error/request handling. Record the current implementation and reproducible failures without modifying the application.

### Modified

- `Brain/README.md`: current baseline, redesign, regression status and verification summary.
- `Brain/PROJECT_OVERVIEW.md`: panel workflow, actual controls/horizons, removed inputs, fallback metrics and explanation scope.
- `Brain/ARCHITECTURE.md`: new modules, request-loop regression, fallback path, XAI computation and chart semantics.
- `Brain/API_REFERENCE.md`: xai_explanation fields/units, removed 409 contract, UI/API differences and response-sample limitations.
- `Brain/DEVELOPMENT.md`: current setup/testing failures, removed root lockfile, changed UI and API compatibility.
- `Brain/TESTING.md`: September 17 build/test results, bounded ASGI/engine diagnostics, generated-CSS inspection and clearly separated historical results.
- `Brain/KNOWN_ISSUES.md`: reopen NAV-01/02/06; update affected findings; retire NAV-21 with removed UI; add NAV-24 through NAV-27.
- `Brain/FILE_INVENTORY.md`: current 33 source/support files, removed/restored files, physical counts and dependency/sample metadata.
- `Brain/GIT_CHANGE_HISTORY.md`: extend verified per-file history through 6097e6c, c996de7 and dccfa3b.
- `Brain/CONTRIBUTING.md`: main-only team workflow, review of AI-assisted deletions and consistency requirements.

### Added / removed / renamed

No application or documentation files added, removed or renamed by this review. Application source and dependency declarations were unchanged. Ignored frontend/dist files were regenerated by the production build. Vendor artifacts were inventoried, not modified or audited internally.

### Validation and impact

Three original backend checks passed; no-route suite failed at import of removed NoRouteFoundError (zero cases executed); npm test failed because the script is absent (zero cases executed). Production build passed with 1,560 modules. An all-land in-process API probe returned HTTP 200, 25 fallback points and LOW risk; an all-water probe exposed artificial endpoint explanation factors. Identical endpoints reproduced ZeroDivisionError. Selected dynamic safety CSS classes were absent from the production stylesheet. Documentation links, inventory coverage and diff whitespace were checked after editing.

No browser/hosted verification, clean dependency installation, new security audit, scientific validation, commit, push or deployment. This is a documentation update, not a repair of the identified defects. Reverting only this documentation change restores stale descriptions; do not revert application work to undo it.

## 2026-09-17 — Restore documentation and tests (dccfa3b)

### Added / restored

- `Brain/API_REFERENCE.md`, `Brain/ARCHITECTURE.md`, `Brain/CHANGELOG.md`, `Brain/CONTRIBUTING.md`, `Brain/DEVELOPMENT.md`, `Brain/FILE_INVENTORY.md`, `Brain/GIT_CHANGE_HISTORY.md`, `Brain/KNOWN_ISSUES.md`, `Brain/PROJECT_OVERVIEW.md`, `Brain/README.md`, `Brain/TESTING.md`.
- `backend/test_no_route.py`, `frontend/src/App.test.jsx`.

The thirteen restored files match 6097e6c. Git shows no modifications to application source or package files in this commit. Restoration did not restore the behaviors tested; current failures are documented in TESTING. No validation at commit time is inferred.

## 2026-09-17 — Panel redesign and route explanations (c996de7)

### Added

- `frontend/src/components/panels/LeftControls.jsx`: compact port/preset/class/horizon/layer controls; no manual coordinates or buffer input.
- `frontend/src/components/panels/MapArea.jsx`: PolarMap wrapper.
- `frontend/src/components/panels/DecisionSupport.jsx`: metrics, explanation dialog, comparison, drift-speed chart and alerts; includes fallback metric fixtures.
- `frontend/src/components/panels/BottomStatusBar.jsx`: mounted online/safety footer and client clock label.
- `frontend/src/components/StatusBar.jsx`: unused alternative footer.
- `backend/response.json`: static response sample without the new explanation field.
- Four `backend/__pycache__/*.cpython-313.pyc` files for data_engine, drift_engine, main and pathfinder.

### Modified

- `backend/pathfinder.py`: adds deterministic explanation summaries and sampled factors; removes NoRouteFoundError and restores interpolated fallback on failed graph search.
- `backend/main.py`: adds xai_explanation to route response; removes HTTP 409 mapping/OpenAPI description.
- `frontend/src/App.jsx`: composes new panels, stores explanations and runs a one-second clock; removes scalar request dependencies, cancellation, stale-result protection, result clearing, response validation and specific no-route/error UI.
- `frontend/src/components/Navbar.jsx`: tab/profile layout and loading/fallback banner; most buttons are placeholders.
- `frontend/src/components/RouteComparisonModal.jsx`: removes the no-results guard.
- `frontend/package.json`, `frontend/package-lock.json`: remove npm test, Vitest and React Test Renderer declarations/resolutions.

### Removed

- All eleven `Brain/*.md` files and both `backend/test_no_route.py` / `frontend/src/App.test.jsx` (restored in dccfa3b).
- `frontend/src/components/ControlDeck.jsx`, `frontend/src/components/TelemetrySidebar.jsx` (roles replaced by the new panels; not restored).
- The unused application-root `package-lock.json`.
- Four `backend/__pycache__/*.cpython-314.pyc` files for data_engine, drift_engine, main and pathfinder.

### Compatibility and validation

Explanation is an added response field; graph failure behavior regressed from explicit 409 to success-shaped fallback. Old component tests no longer match the active UI. Earlier tests cannot be claimed as passing for this revision. September 17 review results above are current evidence, not evidence recorded at commit time. Preserve intended redesign changes when repairing the regressions; a wholesale revert also removes new functionality.

## 2026-09-16 — Commit documentation and NAV fixes (6097e6c)

Committed all eleven Brain documents, backend/test_no_route.py, frontend/src/App.test.jsx and the NAV-01/02/06 changes in backend/main.py, backend/pathfinder.py, frontend/src/App.jsx, frontend/src/components/RouteComparisonModal.jsx, frontend/src/components/TelemetrySidebar.jsx, frontend/package.json and frontend/package-lock.json. Also added an empty application-root package-lock.json and four Python 3.14 bytecode files. The September 14 records below describe the preceding work; no new validation at commit time is inferred.

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

Indian port selection and the simplified land mask already exist in this initial import. There are no separate commits identifying when they were developed. [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md) lists individual first-party file statuses. At that original history checkpoint no first-party source removal was recorded; c996de7 later removed source files as listed above.
