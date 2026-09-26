> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

# Git change history

## Working-tree checkpoint — 26 September 2026

Local HEAD remains `8bb44ea` (verified during this documentation update). Recent observation-backed routing, objective separation, SVG route rendering, report stacking repairs and the world-boundary revert are working-tree changes, not new commits. This documentation pass creates no commit or push. [CHANGELOG.md](CHANGELOG.md) records those changes; the committed history below remains historical and unchanged.


Refreshed **2026-09-24** from local reachable history through **8bb44ea**. No remote fetch performed. Paths are Git-root-relative. This file is generated from commit metadata and name/status diffs, not inferred author intent.

For merge commits, changed files below are compared with the first parent. This avoids treating a merge with an empty ordinary git-show diff as no change. Vendor/runtime/generated/binary paths are excluded from per-file tables and counted separately. A/M/D/R are Git statuses.

## Recent changes

- 5391c86 replaced core routing/data/UI with three profiles, bunker checks, origin modes and layers.
- 8eaf4b8 is a merge; it brings retained Brain/tests/auth/panels and other files into its first-parent tree, without proving those modules are mounted.
- 8bb44ea connected prominent PDF export controls and modified report generation.
- The current uncommitted review modifies Brain references and adds AUDIT_2026-09-24.md. A follow-up implementation also adds `OfficialIcebergLayer.jsx`, `icebergVisibility.js` and its tests, and modifies App/map/sidebar/styles. Running the backend modified the tracked runtime SQLite file; review that generated-state diff separately before committing.

## Commit/file record

### 9d73480 — 2026-09-03T16:12:43+05:30

Initial commit for SIH polar navigation dashboard

| Status | Path |
| --- | --- |
| A | `.antigravity/Dockerfile` |
| A | `.antigravity/argv.json` |
| A | `.antigravity/backend/data_engine.py` |
| A | `.antigravity/backend/drift_engine.py` |
| A | `.antigravity/backend/main.py` |
| A | `.antigravity/backend/pathfinder.py` |
| A | `.antigravity/backend/requirements.txt` |
| A | `.antigravity/backend/test_backend.py` |
| A | `.antigravity/frontend/index.html` |
| A | `.antigravity/frontend/package-lock.json` |
| A | `.antigravity/frontend/package.json` |
| A | `.antigravity/frontend/postcss.config.js` |
| A | `.antigravity/frontend/src/App.jsx` |
| A | `.antigravity/frontend/src/components/ControlDeck.jsx` |
| A | `.antigravity/frontend/src/components/Navbar.jsx` |
| A | `.antigravity/frontend/src/components/PolarMap.jsx` |
| A | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| A | `.antigravity/frontend/src/components/TelemetrySidebar.jsx` |
| A | `.antigravity/frontend/src/index.css` |
| A | `.antigravity/frontend/src/main.jsx` |
| A | `.antigravity/frontend/tailwind.config.js` |
| A | `.antigravity/frontend/vercel.json` |
| A | `.antigravity/frontend/vite.config.js` |
| A | `.antigravity/render.yaml` |
| A | `.antigravity/setup_node.py` |

Excluded vendor/runtime/generated/binary path changes: 10234.

### 1b67896 — 2026-09-03T16:13:57+05:30

Clean commit for SIH polar navigation dashboard

| Status | Path |
| --- | --- |
| A | `.antigravity/.gitignore` |

Excluded vendor/runtime/generated/binary path changes: 9403.

### aed3252 — 2026-09-03T16:14:09+05:30

Clean commit for SIH polar navigation dashboard

| Status | Path |
| --- | --- |
| M | `.antigravity/.gitignore` |

### 444ef61 — 2026-09-03T16:14:20+05:30

Clean commit for SIH polar navigation dashboard

| Status | Path |
| --- | --- |
| M | `.antigravity/.gitignore` |

### da69f5f — 2026-09-12T15:24:25+05:30

first commit

| Status | Path |
| --- | --- |
| A | `README.md` |

### 6097e6c — 2026-09-16T23:14:14+05:30

Prathvish

| Status | Path |
| --- | --- |
| A | `.antigravity/Brain/API_REFERENCE.md` |
| A | `.antigravity/Brain/ARCHITECTURE.md` |
| A | `.antigravity/Brain/CHANGELOG.md` |
| A | `.antigravity/Brain/CONTRIBUTING.md` |
| A | `.antigravity/Brain/DEVELOPMENT.md` |
| A | `.antigravity/Brain/FILE_INVENTORY.md` |
| A | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| A | `.antigravity/Brain/KNOWN_ISSUES.md` |
| A | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| A | `.antigravity/Brain/README.md` |
| A | `.antigravity/Brain/TESTING.md` |
| M | `.antigravity/backend/main.py` |
| M | `.antigravity/backend/pathfinder.py` |
| A | `.antigravity/backend/test_no_route.py` |
| M | `.antigravity/frontend/package-lock.json` |
| M | `.antigravity/frontend/package.json` |
| M | `.antigravity/frontend/src/App.jsx` |
| A | `.antigravity/frontend/src/App.test.jsx` |
| M | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| M | `.antigravity/frontend/src/components/TelemetrySidebar.jsx` |
| A | `.antigravity/package-lock.json` |

Excluded vendor/runtime/generated/binary path changes: 4.

### 48e6a94 — 2026-09-16T23:30:58+05:30

ansh

| Status | Path |
| --- | --- |
| M | `.antigravity/frontend/src/App.jsx` |

Excluded vendor/runtime/generated/binary path changes: 4.

### c996de7 — 2026-09-17T19:48:27+05:30

Jagruti

| Status | Path |
| --- | --- |
| D | `.antigravity/Brain/API_REFERENCE.md` |
| D | `.antigravity/Brain/ARCHITECTURE.md` |
| D | `.antigravity/Brain/CHANGELOG.md` |
| D | `.antigravity/Brain/CONTRIBUTING.md` |
| D | `.antigravity/Brain/DEVELOPMENT.md` |
| D | `.antigravity/Brain/FILE_INVENTORY.md` |
| D | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| D | `.antigravity/Brain/KNOWN_ISSUES.md` |
| D | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| D | `.antigravity/Brain/README.md` |
| D | `.antigravity/Brain/TESTING.md` |
| M | `.antigravity/backend/main.py` |
| M | `.antigravity/backend/pathfinder.py` |
| A | `.antigravity/backend/response.json` |
| D | `.antigravity/backend/test_no_route.py` |
| M | `.antigravity/frontend/package-lock.json` |
| M | `.antigravity/frontend/package.json` |
| M | `.antigravity/frontend/src/App.jsx` |
| D | `.antigravity/frontend/src/App.test.jsx` |
| D | `.antigravity/frontend/src/components/ControlDeck.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| M | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| A | `.antigravity/frontend/src/components/StatusBar.jsx` |
| D | `.antigravity/frontend/src/components/TelemetrySidebar.jsx` |
| A | `.antigravity/frontend/src/components/panels/BottomStatusBar.jsx` |
| A | `.antigravity/frontend/src/components/panels/DecisionSupport.jsx` |
| A | `.antigravity/frontend/src/components/panels/LeftControls.jsx` |
| A | `.antigravity/frontend/src/components/panels/MapArea.jsx` |
| D | `.antigravity/package-lock.json` |

Excluded vendor/runtime/generated/binary path changes: 8.

### dccfa3b — 2026-09-17T20:19:20+05:30

jagruti

| Status | Path |
| --- | --- |
| A | `.antigravity/Brain/API_REFERENCE.md` |
| A | `.antigravity/Brain/ARCHITECTURE.md` |
| A | `.antigravity/Brain/CHANGELOG.md` |
| A | `.antigravity/Brain/CONTRIBUTING.md` |
| A | `.antigravity/Brain/DEVELOPMENT.md` |
| A | `.antigravity/Brain/FILE_INVENTORY.md` |
| A | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| A | `.antigravity/Brain/KNOWN_ISSUES.md` |
| A | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| A | `.antigravity/Brain/README.md` |
| A | `.antigravity/Brain/TESTING.md` |
| A | `.antigravity/backend/test_no_route.py` |
| A | `.antigravity/frontend/src/App.test.jsx` |

### 3684d67 — 2026-09-17T20:44:16+05:30

 prathvish

| Status | Path |
| --- | --- |
| M | `.antigravity/Brain/API_REFERENCE.md` |
| M | `.antigravity/Brain/ARCHITECTURE.md` |
| M | `.antigravity/Brain/CHANGELOG.md` |
| M | `.antigravity/Brain/CONTRIBUTING.md` |
| M | `.antigravity/Brain/DEVELOPMENT.md` |
| M | `.antigravity/Brain/FILE_INVENTORY.md` |
| M | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| M | `.antigravity/Brain/KNOWN_ISSUES.md` |
| M | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| M | `.antigravity/Brain/README.md` |
| M | `.antigravity/Brain/TESTING.md` |

### 6d1f221 — 2026-09-17T23:02:32+05:30

Prathvish

| Status | Path |
| --- | --- |
| M | `.antigravity/Brain/API_REFERENCE.md` |
| M | `.antigravity/Brain/ARCHITECTURE.md` |
| M | `.antigravity/Brain/CHANGELOG.md` |
| M | `.antigravity/Brain/CONTRIBUTING.md` |
| M | `.antigravity/Brain/DEVELOPMENT.md` |
| M | `.antigravity/Brain/FILE_INVENTORY.md` |
| M | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| M | `.antigravity/Brain/KNOWN_ISSUES.md` |
| M | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| M | `.antigravity/Brain/README.md` |
| M | `.antigravity/Brain/TESTING.md` |
| M | `.antigravity/backend/main.py` |
| M | `.antigravity/backend/pathfinder.py` |
| M | `.antigravity/backend/test_no_route.py` |
| M | `.antigravity/frontend/package-lock.json` |
| M | `.antigravity/frontend/package.json` |
| M | `.antigravity/frontend/src/App.jsx` |
| M | `.antigravity/frontend/src/App.test.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| M | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| M | `.antigravity/frontend/src/components/panels/BottomStatusBar.jsx` |
| M | `.antigravity/frontend/src/components/panels/DecisionSupport.jsx` |

### dedbb48 — 2026-09-18T09:05:22+05:30

Prathvish

| Status | Path |
| --- | --- |
| M | `.antigravity/Brain/API_REFERENCE.md` |
| M | `.antigravity/Brain/ARCHITECTURE.md` |
| M | `.antigravity/Brain/CHANGELOG.md` |
| M | `.antigravity/Brain/DEVELOPMENT.md` |
| M | `.antigravity/Brain/FILE_INVENTORY.md` |
| M | `.antigravity/Brain/KNOWN_ISSUES.md` |
| M | `.antigravity/Brain/README.md` |
| M | `.antigravity/Brain/TESTING.md` |
| M | `.antigravity/backend/main.py` |
| A | `.antigravity/backend/navigation_geometry.py` |
| M | `.antigravity/backend/pathfinder.py` |
| M | `.antigravity/backend/test_backend.py` |
| M | `.antigravity/backend/test_no_route.py` |
| A | `.antigravity/backend/test_route_correctness.py` |
| M | `.antigravity/frontend/src/App.jsx` |
| M | `.antigravity/frontend/src/App.test.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| M | `.antigravity/frontend/src/components/PolarMap.jsx` |
| M | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| A | `.antigravity/frontend/src/components/VisibleUI.test.jsx` |
| A | `.antigravity/frontend/src/components/displayValues.js` |
| M | `.antigravity/frontend/src/components/panels/DecisionSupport.jsx` |
| M | `.antigravity/frontend/src/components/panels/LeftControls.jsx` |

Excluded vendor/runtime/generated/binary path changes: 4.

### 2cc8271 — 2026-09-18T19:53:50+05:30

Update SIH project

| Status | Path |
| --- | --- |
| M | `.antigravity/backend/data_engine.py` |
| A | `.antigravity/backend/database.py` |
| M | `.antigravity/backend/main.py` |
| M | `.antigravity/frontend/src/App.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| A | `.gitignore` |
| A | `tatus --short` |

### b3acc9d — 2026-09-19T07:24:00+05:30

deploy

| Status | Path |
| --- | --- |
| M | `.antigravity/Brain/API_REFERENCE.md` |
| M | `.antigravity/Brain/ARCHITECTURE.md` |
| M | `.antigravity/Brain/CHANGELOG.md` |
| M | `.antigravity/Brain/CONTRIBUTING.md` |
| M | `.antigravity/Brain/DEVELOPMENT.md` |
| M | `.antigravity/Brain/FILE_INVENTORY.md` |
| M | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| M | `.antigravity/Brain/KNOWN_ISSUES.md` |
| M | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| M | `.antigravity/Brain/README.md` |
| M | `.antigravity/Brain/TESTING.md` |
| M | `.antigravity/backend/data_engine.py` |
| M | `.antigravity/backend/main.py` |
| M | `.antigravity/frontend/package-lock.json` |
| M | `.antigravity/frontend/package.json` |
| M | `.antigravity/frontend/src/App.jsx` |
| M | `.antigravity/frontend/src/App.test.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| M | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| M | `.antigravity/frontend/src/components/VisibleUI.test.jsx` |
| M | `.antigravity/frontend/src/components/panels/DecisionSupport.jsx` |
| M | `.antigravity/frontend/src/components/panels/LeftControls.jsx` |
| A | `.antigravity/frontend/src/utils/pdfGenerator.js` |

Excluded vendor/runtime/generated/binary path changes: 3.

### a93f7e2 — 2026-09-20T19:49:47+05:30

New Features

| Status | Path |
| --- | --- |
| M | `.antigravity/Brain/API_REFERENCE.md` |
| M | `.antigravity/Brain/ARCHITECTURE.md` |
| M | `.antigravity/Brain/CHANGELOG.md` |
| M | `.antigravity/Brain/CONTRIBUTING.md` |
| M | `.antigravity/Brain/DEVELOPMENT.md` |
| M | `.antigravity/Brain/FILE_INVENTORY.md` |
| M | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| M | `.antigravity/Brain/KNOWN_ISSUES.md` |
| M | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| M | `.antigravity/Brain/README.md` |
| M | `.antigravity/Brain/TESTING.md` |
| M | `.antigravity/backend/main.py` |
| M | `.antigravity/frontend/src/App.jsx` |
| M | `.antigravity/frontend/src/App.test.jsx` |
| A | `.antigravity/frontend/src/components/LoginModal.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| A | `.antigravity/frontend/src/context/AuthContext.jsx` |

Excluded vendor/runtime/generated/binary path changes: 1.

### 5391c86 — 2026-09-23T08:42:12+05:30

adding lot of new things

| Status | Path |
| --- | --- |
| A | `.antigravity/backend/_verify_bunker.py` |
| A | `.antigravity/backend/_verify_pareto.py` |
| M | `.antigravity/backend/data_engine.py` |
| M | `.antigravity/backend/main.py` |
| M | `.antigravity/backend/pathfinder.py` |
| A | `.antigravity/backend/polar_nav_offline.db` |
| A | `.antigravity/backend/test_gating_and_circuit.py` |
| A | `.antigravity/backend/test_invoyage_live.py` |
| A | `.antigravity/backend/test_live_apis.py` |
| M | `.antigravity/frontend/src/App.jsx` |
| M | `.antigravity/frontend/src/App.test.jsx` |
| M | `.antigravity/frontend/src/components/ControlDeck.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| M | `.antigravity/frontend/src/components/PolarMap.jsx` |
| M | `.antigravity/frontend/src/components/TelemetrySidebar.jsx` |
| A | `inspect_steps.py` |
| A | `scratch_prompt.txt` |
| A | `scratch_prompt_full.txt` |

Excluded vendor/runtime/generated/binary path changes: 6.

### 8eaf4b8 — 2026-09-23T08:50:50+05:30

New features added

Merge: file changes relative to first parent 5391c86.

| Status | Path |
| --- | --- |
| M | `.antigravity/Brain/API_REFERENCE.md` |
| M | `.antigravity/Brain/ARCHITECTURE.md` |
| M | `.antigravity/Brain/CHANGELOG.md` |
| M | `.antigravity/Brain/CONTRIBUTING.md` |
| M | `.antigravity/Brain/DEVELOPMENT.md` |
| M | `.antigravity/Brain/FILE_INVENTORY.md` |
| M | `.antigravity/Brain/GIT_CHANGE_HISTORY.md` |
| M | `.antigravity/Brain/KNOWN_ISSUES.md` |
| M | `.antigravity/Brain/PROJECT_OVERVIEW.md` |
| M | `.antigravity/Brain/README.md` |
| M | `.antigravity/Brain/TESTING.md` |
| A | `.antigravity/backend/database.py` |
| A | `.antigravity/backend/navigation_geometry.py` |
| A | `.antigravity/backend/response.json` |
| M | `.antigravity/backend/test_backend.py` |
| M | `.antigravity/backend/test_no_route.py` |
| A | `.antigravity/backend/test_route_correctness.py` |
| M | `.antigravity/frontend/package-lock.json` |
| M | `.antigravity/frontend/package.json` |
| A | `.antigravity/frontend/src/components/LoginModal.jsx` |
| M | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| A | `.antigravity/frontend/src/components/StatusBar.jsx` |
| A | `.antigravity/frontend/src/components/VisibleUI.test.jsx` |
| A | `.antigravity/frontend/src/components/displayValues.js` |
| A | `.antigravity/frontend/src/components/panels/BottomStatusBar.jsx` |
| A | `.antigravity/frontend/src/components/panels/DecisionSupport.jsx` |
| A | `.antigravity/frontend/src/components/panels/LeftControls.jsx` |
| A | `.antigravity/frontend/src/components/panels/MapArea.jsx` |
| A | `.antigravity/frontend/src/context/AuthContext.jsx` |
| A | `.antigravity/frontend/src/utils/pdfGenerator.js` |
| D | `.antigravity/package-lock.json` |
| A | `.gitignore` |

Excluded vendor/runtime/generated/binary path changes: 10.

### 8bb44ea — 2026-09-23T09:11:00+05:30

Add prominent Export PDF Report buttons across Navbar, Sidebar, and Modal with robust nav plan generation

| Status | Path |
| --- | --- |
| M | `.antigravity/frontend/src/App.jsx` |
| M | `.antigravity/frontend/src/components/Navbar.jsx` |
| M | `.antigravity/frontend/src/components/RouteComparisonModal.jsx` |
| M | `.antigravity/frontend/src/components/TelemetrySidebar.jsx` |
| M | `.antigravity/frontend/src/utils/pdfGenerator.js` |
