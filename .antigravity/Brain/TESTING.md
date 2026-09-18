# Testing and verification

## Latest verification — route correctness, 2026-09-18

- `backend/venv/Scripts/python.exe -B -m unittest discover -s backend -p 'test_*.py'`: **24 passed** (5 existing no-route tests, 19 adversarial route/API tests).
- `backend/venv/Scripts/python.exe -B backend/test_backend.py`: **3 pipeline checks passed**. Original forced-positive savings assertion replaced with signed baseline consistency; all route segments checked against modeled hazard envelopes without the former 8% penetration tolerance. Default route at 1-degree resolution: 3725.5 NM and -20.3% modeled savings. This is model evidence, not a navigation safety certification.
- `npm.cmd test`: **36 passed** (21 App request/error cases, 15 visible-UI/coverage cases). Existing deprecation warnings remain.
- `npm.cmd run build`: **passed**, 1,561 modules; HTML 1.27 kB, CSS 24.50 kB, JS 352.33 kB.
- New backend tests cover finite/geographic/domain/workload validation, identical endpoints, 422 responses before forecasts, thin/finite land barriers, blocked endpoints, hazards between clear nodes, full-trajectory envelopes, directed costs, A* versus Dijkstra, exact close endpoints, real endpoint XAI, geodesic baseline length, open-water ice exclusion, high exposure scores, speed-dependent fuel, forecast gaps, short supplied forecasts, defensive final checks, and HTTP response compatibility.
- UI tests cover input rejection, signed savings, supplied baseline fuel/time, unavailable/blocked-baseline context, forecast gaps, and the planning envelope radius used by the map.
- No new browser session or external coastline/scientific validation was performed for the routing changes. The UI browser checks below remain evidence for the preceding UI task. No dependencies added; no commit/push performed.

## Earlier UI verification

## Visible UI verification — 2026-09-18 (preceding routing changes)

- `npm.cmd test` from frontend: **33 passed** across two files (20 existing App lifecycle/error regressions and 13 new visible-UI cases).
- `npm.cmd run build`: **passed**, 1,561 modules; HTML 1.27 kB, CSS 24.50 kB, JS 351.11 kB. Existing Vitest esbuild/oxc deprecation warnings remain.
- New coverage: all three hour selections, preset station/departure labels, port selection/reset, duration day rollover, all three risk styles, zero/missing comparisons, missing forecast gaps, four independent layer combinations, curved trajectory geometry, endpoint popups and navigation shortcuts.
- Browser checked against local frontend/backend at 1280×720: successful dashboard layout, 72-to-24-hour change updating map/chart, Analytics showing returned values and zero intersections, Mumbai search/selection and its name/coordinates in the departure popup. Analytics layout inspected visually.
- Built CSS contains the low/moderate/high risk backgrounds and borders and cyan checkbox classes. `git diff --check` passed.
- Backend algorithms and dependencies were not changed; backend suites were not rerun in this UI-only task. No scientific validation, full responsive matrix, commit or push performed.

## Prior verification checkpoints

## Restoration verification — local restoration on 3684d67, 2026-09-17 (historical)

| Check | Result |
| --- | --- |
| `backend/venv/Scripts/python.exe -B backend/test_backend.py` | 3 original checks passed |
| `backend/venv/Scripts/python.exe -B backend/test_no_route.py` | 5 engine/ASGI tests passed |
| `npm.cmd test` in frontend | 20 component tests passed |
| `npm.cmd run build` in frontend | Passed, 1,560 modules transformed |

**28 checks/tests passed.** Backend uses Python 3.14.4; frontend uses Node 24.14.1, npm 11.11.0 and Vite 5.4.21. Build outputs: HTML 1.27 kB, CSS 25.47 kB, JS 356.17 kB. Test dependencies are now pinned, locked and installed: Vitest 4.1.11 and React Test Renderer 18.3.1. npm install reported two advisories (one moderate, one high); no force upgrade was performed. The Vite React plugin still emits esbuild/oxc deprecation warnings during tests.

### Regression coverage

- Original request/error/no-route assertions are retained with a LeftControls mock and complete numeric fixtures for the new DecisionSupport panel.
- Actual Navbar, MapArea wrapper, DecisionSupport, BottomStatusBar and RouteComparisonModal render in the tests. Controls and PolarMap rendering are isolated; fetch is mocked and deliberately allows aborted requests to resolve.
- Cases cover parameter changes, equal coordinate objects, manual refresh, stale successes/errors/no-route messages, loading ownership, unmount/remount and retry recovery.
- Fake timers verify that five seconds of App clock updates neither while loading nor after success trigger new requests, and that its timer is cleaned up on unmount.
- Invalid JSON, missing results, partial metrics, invalid waypoint and non-array overlay responses produce errors instead of fixture results.
- Explanation dialog, drift chart, alerts and metrics display after success and disappear on refresh/failure. A deferred JSON race cannot replace the latest explanation or route.
- Backend tests cover disconnected graphs, missing endpoints, all-land grids, actual HTTP 409 serialization and successful HTTP 200 geometry/metrics/XAI. No-route assertions now explicitly prohibit xai_explanation as well as success geometry and metrics.

### Scope and limits

The panel redesign and successful-route XAI are retained. No-route now returns 409 without success data; previous all-land HTTP 200 observations below are historical evidence of the repaired regression. Validation is a minimum usability guard, not full nested response-schema checking or geographic validation. Other routing, model, metric and UI issues remain open.

No browser visual/live-network/ReactDOM StrictMode replay test, isolated clean-install check, container build, hosted deployment or scientific validation was performed. The original backend tests' collision-free console text exceeds their waypoint-only assertions. No commit, push or deployment was performed. Documentation links/source inventory and git diff --check are checked before completion.

## Earlier review evidence (before this restoration)

The remaining sections intentionally retain failed commands and earlier passing checkpoints. References to missing scripts/exceptions, obsolete mocks or fallback behavior below describe the code before the current repair, not its current state.

## Pre-restoration review — 2026-09-17, dccfa3b (historical)

The working tree was clean at the start. Only Brain documents were edited; the build regenerated ignored dist assets. Commands used the existing local environments without installing dependencies. Shell command groups may finish with the last command's status; individual failures below are recorded from their actual output, not hidden by a subsequent successful version command.

| Check / command | Observed result | Scope |
| --- | --- | --- |
| `backend/venv/Scripts/python.exe -B backend/test_backend.py` | 3 original checks passed | Synthetic metocean, drift and default route; 3389.8 NM, 4.5% modeled savings |
| `backend/venv/Scripts/python.exe -B backend/test_no_route.py` | Failed during import: cannot import NoRouteFoundError | None of its five tests executed |
| `npm.cmd test` in frontend | Failed: Missing script: test | None of the fourteen component cases executed |
| `npm.cmd run build` in frontend | Passed; 1,560 modules transformed | Bundle only; not browser/runtime correctness |
| In-process ASGI all-water probe | HTTP 200; 3 waypoints; XAI included | Small synthetic route, no external network |
| In-process ASGI all-land probe | HTTP 200; 25 fallback waypoints; LOW risk | Confirms NAV-02 regression; not a passing safety test |
| Identical-endpoint engine probe | ZeroDivisionError | Confirms NAV-18 at (-50,40) with no iceberg forecasts |
| Generated CSS inspection | Missing dynamic safety background/border selectors | Confirms part of NAV-15; no visual browser check |

Environment: backend virtual environment Python **3.14.4**, system Node **24.14.1**, npm **11.11.0**, installed/locked Vite **5.4.21**. Build output: HTML **1.27 kB**, CSS **25.19 kB**, JS **354.87 kB**. Existing node_modules still contains Vitest 4.1.11 and React Test Renderer 18.3.1, but neither is declared or locked now. Their presence does not establish a working test suite or a clean-install check.

Documentation verification: all **11** Markdown files, **26** local links and **33** inventory paths checked; issue IDs 01–27 are unique and complete. Git blob comparisons confirmed all **13** files restored by dccfa3b match 6097e6c. Final tracked diff contains only the eleven Brain files; git diff --check passed.

## Historical mismatch before repairs

`dccfa3b` restored both test files unchanged from `6097e6c`. `test_no_route.py` imports an exception removed from pathfinder.py. App.test.jsx mocks a deleted ControlDeck module, looks for its controls element, expects fetch options.signal and cancellation, and asserts old telemetry/alert states. The active UI mounts LeftControls and DecisionSupport. Its fixtures also lack numeric fields that the new panels call toFixed on. Source mismatches are known; no direct invocation of the leftover Vitest installation was attempted.

To repair testing, restore the declared test command/dependencies and compatible mocks/fixtures while preserving the intended lifecycle/no-route/empty-state assertions. Restore the application guarantees, then rerun the suites. Do not remove tests or weaken no-route assertions merely to accommodate the regression.

## Historical diagnostic reproduction details

The ASGI probes called the actual FastAPI app in process with GET `/api/v1/polar-route?start_lat=-34&start_lon=18&end_lat=-35&end_lon=19&forecast_hours=0`, patched `main.get_initial_icebergs` to return an empty list, and patched `LandMask.is_land` false/true respectively. Standard-library asyncio/unittest.mock supplied the harness through stdin; no diagnostic source files were added.

In the all-water response, maximum sampled route SIC was 0, but the endpoint XAI reported SIC 0.8 and ice penalty 7.22 with zero wind/current speed. In the all-land response, the 25 fallback points still had explanations with default graph factors and normal success metrics. This supports NAV-25 as well as NAV-02.

CSS inspection found `.bg-emerald-950/50`, `.bg-amber-950/50`, `.bg-red-950/50`, `.border-emerald-500/30` and `.border-amber-500/30` absent (checked with escaped CSS selectors). Cyan checkbox selectors and literal text colors were present. Only these selected selectors were checked.

## Pre-restoration verification limits and proposed checks

No browser/UI smoke test, live Uvicorn network test, hosted deployment check, clean npm/Python install, new dependency audit, Docker build, real provider verification or scientific validation was performed. The earlier 22-pass result is historical. Passing original engine checks cannot validate segment safety: they allow points as close as 92% of a hazard radius and do not check connecting segments.

After repairing the regressions, verify request counts across the one-second clock and parameter changes; outage/empty/partial payload behavior; all-land no-route responses; 24/48/72-hour labels; current panel interactions; XAI factor provenance; actual route-baseline comparison; independent layers; and production styling. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Historical evidence — September 14 only

The following sections preserve earlier results and procedures. They do not describe the current passing status or current frontend component structure. The earlier 3 + 5 backend checks and 14 frontend tests were recorded as passing before c996de7; that implementation was later committed in 6097e6c.

## Original documentation baseline results

Date: 2026-09-14. These historical results describe the original `da69f5f` review before the local NAV fixes. Later historical sections record those fixes; September 17 verification is at the top of this document.

| Check | Result | Scope |
| --- | --- | --- |
| Read application Python, JSX, CSS, HTML and configuration | Completed | Source-based architecture, API and issue findings |
| Inspect local Git history/status | Completed | Five existing commits; source unchanged before documentation edits |
| `python -B backend/test_backend.py` | Blocked during import | Python 3.14.4 lacks `shapely`; no test assertions executed |
| `backend/venv/Scripts/python.exe -B backend/test_backend.py` | Passed | All three existing engine tests passed using the existing project environment |
| `npm.cmd run build` in `frontend` | Passed | Node v24.14.1; installed Vite 5.4.21; 1,558 modules transformed |
| Markdown local links and file presence | Checked during documentation completion | Documentation integrity only |

Frontend output: `dist/index.html` (1.27 kB), CSS (24.24 kB) and JavaScript (353.25 kB). The build regenerated ignored output. A successful bundle does not check browser behavior, backend integration or route correctness.

The default Python dependency failure was resolved for verification by using the existing `backend/venv` interpreter, without installing packages. The tested route reported 3389.8 NM and 4.5% modeled fuel savings. No browser/UI session, HTTP integration test, container build, deployment verification, external feed verification or scientific model validation was performed.

## Original backend engine coverage

`backend/test_backend.py` defines three plain-assertion tests and invokes them when run as a script:

1. `test_metocean_engine`: wind direction/speed, current strength, and representative open-water/pack-ice SIC values.
2. `test_drift_physics_engine`: minimum catalog size, A23a displacement, 73 hourly records, terminal snapshot and buffer vertex count.
3. `test_pathfinder_collision_avoidance`: default Cape Town/Bharati route with a 1.0-degree grid, basic metrics, and waypoint distance from predicted hazard centers.

The last test permits waypoint distances as low as 92% of the hazard radius. It does not test the line segments between waypoints. Its printed “100% collision-free” and “100% verification” messages therefore exceed what its assertions establish. The API uses a different 0.85-degree grid.

## Historical backend command guidance

After installing requirements as described in `DEVELOPMENT.md`, from the application root:

```powershell
.\.venv\Scripts\python.exe -B backend\test_backend.py
```

On this reviewed checkout, the already-present environment also works: `.\backend\venv\Scripts\python.exe -B backend\test_backend.py`. Use a freshly created environment when the copied environment is unavailable or not portable.

There is no pytest dependency in requirements, no configured lint/typecheck script, and no first-party CI workflow found. At the September 14 checkpoint the frontend had `npm.cmd test` (Vitest), added with NAV-01. This was removed in c996de7; it is not a current runnable command.

## Coverage recommendations retained from September 14

| Area | Cases and expected evidence |
| --- | --- |
| API contract | Every endpoint; defaults; 0/24/72/168-hour forecasts; invalid query types and limits |
| No-route behavior | Isolated endpoints must yield explicit failure, not an optimal/safe fallback |
| Geometry | Segment intersections, coastlines, narrow obstacles, endpoints inside hazards, dateline behavior and unsupported latitudes |
| Model integrity | Zero-horizon displacement, consistent units, wind sign conventions and observed-vs-predicted trajectory error |
| Search | A* cost agrees with Dijkstra for directional-current fixtures |
| Metrics | Negative fuel savings remain negative; risk can rise; zero collision count remains zero |
| React requests | Stable request count after rerenders, cancellation/stale-response handling, parameter-driven refresh |
| UI truthfulness | Simulation/offline/stale states; actual horizon and endpoint labels; empty analytics |
| Production styles | Layer toggle colors generated in bundled CSS |

For a manual smoke test, run both services locally, inspect the browser Network panel, change each preset/port/class/slider, toggle layers, open Analytics, and test a backend outage. Record observed behavior and failures against `KNOWN_ISSUES.md`; this procedure has not been executed during the documentation pass.

## NAV-01 regression checks — 2026-09-14

`npm.cmd test` in frontend: **6 passed** using Vitest 4.1.11 and React Test Renderer 18.3.1. Tests exercise actual App hooks with mocked child views and fetch: unrelated rerenders, every route parameter, equivalent coordinate objects, manual refresh, stale results, loading ownership, network failure and unmount/remount. This supersedes the original absence of a frontend test script. These are component tests, not browser/live HTTP tests; React DOM StrictMode replay was not directly tested.

`npm.cmd run build`: **passed**, 1,558 modules transformed. Node 24.14.1 was used; bundled Node 20.18.0 was not validated with the new test tools. Existing Vite 5 / React plugin configuration emits deprecation warnings in the newer test runner. npm audit after installation reports two remaining advisories in the existing Vite/esbuild build tooling; a build-toolchain upgrade is outside NAV-01. `git diff --check` passed.

## NAV-06 regression checks — 2026-09-14

`npm.cmd test`: **11 tests passed**. App tests now use the actual TelemetrySidebar and RouteComparisonModal (map, navbar and controls remain isolated). Five added cases cover initial failure and successful Retry, clearing prior results before a failed recalculation, invalid JSON, missing response fields, and suppressed stale errors. Existing six lifecycle tests continue to pass with usable response fixtures.

`npm.cmd run build`: **passed**, 1,558 modules transformed. `git diff --check`: passed. Existing test-runner deprecation warnings remain. No live service or browser visual verification was performed for this change.

## NAV-02 no-route regression checks — 2026-09-14

- `backend/venv/Scripts/python.exe -B backend/test_no_route.py`: **5 tests passed**. Tests exercise disconnected graphs, missing endpoints, actual graph construction with all grid cells blocked, real FastAPI ASGI HTTP 409 serialization without route/metrics, and successful HTTP 200 routing. The ASGI tests use synthetic data and no external HTTP client dependency.
- `backend/venv/Scripts/python.exe -B backend/test_backend.py`: **all 3 existing tests passed**. Their limitations noted above remain.
- `npm.cmd test` in frontend: **14 tests passed**. Three added cases cover specific no-route messaging with recovery, suppression of a superseded no-route response, and unrelated HTTP 409 errors retaining generic handling.
- `npm.cmd run build`: **passed**, 1,558 modules transformed. Existing test-runner deprecation warnings remain.
- `git diff --check`: passed. No hosted deployment or browser visual test performed.

ASGI tests exercise the actual application's HTTP handling in process; they do not test a listening Uvicorn service or deployed networking.
