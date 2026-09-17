# Testing and verification

## Current verification — documentation re-review, 2026-09-14

The current working tree includes the uncommitted NAV-01, NAV-06 and NAV-02 fixes on top of commit `da69f5f`. All tests below were rerun successfully in this review:

| Command (working directory) | Result |
| --- | --- |
| `backend/venv/Scripts/python.exe -B backend/test_backend.py` (application root) | 3 original engine tests passed |
| `backend/venv/Scripts/python.exe -B backend/test_no_route.py` (application root) | 5 engine/ASGI tests passed |
| `npm.cmd test` (`frontend`) | 14 component tests passed |

The frontend test runner still emits esbuild/oxc deprecation warnings. This review changed documentation only and did not repeat the production build, browser checks, hosted tests or npm audit; their earlier results below are dated evidence, not new verification. Local Markdown links and referenced source paths were checked. Current coverage is 22 tests/checks across the three commands, with geographic and scientific limitations documented below.

To run both backend suites in a configured environment, run `backend/test_backend.py` and `backend/test_no_route.py` separately with that environment's Python interpreter. Frontend tests run with `npm.cmd test` from `frontend`.

## Original documentation baseline results

Date: 2026-09-14. These historical results describe the original `da69f5f` review before the local NAV fixes. Later sections record those fixes and current verification.

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

## Run the backend checks

After installing requirements as described in `DEVELOPMENT.md`, from the application root:

```powershell
.\.venv\Scripts\python.exe -B backend\test_backend.py
```

On this reviewed checkout, the already-present environment also works: `.\backend\venv\Scripts\python.exe -B backend\test_backend.py`. Use a freshly created environment when the copied environment is unavailable or not portable.

There is no pytest dependency in requirements, no configured lint/typecheck script, and no first-party CI workflow found. The current frontend does have `npm.cmd test` (Vitest), added with NAV-01.

## Recommended coverage for future changes

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
