> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

# File inventory

## Current additions and changed roles — 26 September 2026

| Path | Active role / recent change |
|---|---|
| backend/observed_data.py | Dated shared observations and disclosed estimated environment/drift |
| backend/observed_routes.py | Validated finite passage network, common constraints and profile metrics |
| backend/route_objectives.py | Time/exposure objectives, directional edge metrics and corridor overlap |
| backend/route_geometry.py | Complete land/shelf/estimated hazard segment checks |
| backend/test_observation_demo.py; backend/test_route_objectives.py | Current 16-test backend acceptance checkpoint |
| frontend/src/components/PolarMap.jsx | OSM tiles, local fallback, independent SVG routes; world-boundary experiment reverted |
| frontend/src/components/OfficialIcebergLayer.jsx | View/route-filtered canvas observations, drift and selected detail |
| frontend/src/components/RouteComparisonModal.jsx; frontend/src/index.css | Report overlay and isolated, clipped map layout |
| frontend/src/components/VisibleUI.test.jsx | Current display contracts, restored wrapping assertions |
| frontend/src/components/TelemetrySidebar.jsx; frontend/src/utils/pdfGenerator.js | Profile objectives, cumulative exposure and shared-corridor reporting |
| frontend/src/components/GoogleEarthMap.jsx | Retained inactive prototype; not imported by PolarMap |
| Setup-Project.ps1; Start-Project.ps1; Stop-Project.ps1 | Local setup and owned-process lifecycle |
| Brain/*.md | All 17 documents reconciled with recent work; historical sections retained |

This is an incremental first-party inventory, not a new exhaustive dependency or binary audit. Old active-role claims below describe the September 24 checkpoint only.


## Files added/changed for demo fix 01 (2026-09-25)

Added `backend/route_geometry.py`, `backend/data/ne_10m_land.zip`, `backend/data/README.md`, `backend/test_demo_route_safety.py`, `frontend/src/components/RouteAvailability.test.jsx`, and `Brain/DEMO_FIX_01.md`. Updated route engines/API errors, dependencies, frontend route/error/profile handling, and App regression tests. See [DEMO_FIX_01.md](DEMO_FIX_01.md) for scope and validation.

Reviewed **2026-09-24**, code baseline **8bb44ea**, application root `.antigravity`.

The review covered **47 first-party text/source/configuration/data files**, the **11 existing Brain documents**, and the tracked SQLite schema. cloudflared.exe was inventoried without executing or reverse-engineering it. This update adds one Brain audit report. Generated output, installed dependencies, interpreter environments and editor extensions were classified separately; this is not an audit of every third-party file's internals.

## Backend and support

| Path | Current role / review |
| --- | --- |
| .gitignore | Tracked application ignore rules; node_modules and repeated dist entries |
| Dockerfile | Python 3.10 backend image; broad backend COPY, port 10000 |
| render.yaml | Python backend build/start config; no persistent disk |
| argv.json | Editor JSON-with-comments runtime settings, not app configuration |
| setup_node.py | Node 20.18.0 download/extract/replace helper; read, not run |
| cloudflared.exe | Tracked tunnel executable; inventoried only |
| backend/main.py | 18 application endpoints, request models, origin controller, legacy route and emergency fallback |
| backend/data_engine.py | Catalogs, provider adapters, analytic fields, SQLite/layer caches, RIO and fuel calculations |
| backend/drift_engine.py | Weighted wind/current drift, hourly points/snapshots and final buffer |
| backend/pathfinder.py | Active three-profile and legacy engines; undirected grids, guarded search and geometric fallbacks |
| backend/navigation_geometry.py | Spherical/segment helpers retained but not used by current production routing |
| backend/database.py | Disconnected legacy SQLite helper; conflicting registry schema |
| backend/requirements.txt | Eight minimum-version requirements; missing unconditional pyproj dependency |
| backend/response.json | Parsed historical single-route sample: 76 waypoints and 12 present icebergs; not active current response evidence |
| backend/polar_nav_offline.db | Tracked runtime DB, 1,044,480 bytes; seven table definitions inspected read-only; bytes unchanged by audit |
| backend/test_backend.py | Three pipeline functions: controlled run yielded two passes and a missing-field error |
| backend/test_no_route.py | Five legacy engine/ASGI checks: four pass, one missing-XAI error under isolation |
| backend/test_route_correctness.py | Nineteen adversarial cases; cannot load removed InvalidRouteInput |
| backend/test_gating_and_circuit.py | Localhost bunker output and direct fallback demonstration, mostly printing |
| backend/test_invoyage_live.py | Localhost metadata/layer/route smoke script |
| backend/test_live_apis.py | External provider smoke/contract script, not run live in this review |
| backend/_verify_pareto.py | Direct engine profile verification script |
| backend/_verify_bunker.py | Localhost fuel verification script |

## Frontend

| Path | Current role / review |
| --- | --- |
| frontend/package.json | dev/build/preview/test scripts; React, Leaflet, PDF dependencies |
| frontend/package-lock.json | Parsed lockfile v3, 277 package entries; not a full dependency vulnerability assessment |
| frontend/index.html | SPA entry, external font/Leaflet CSS resources |
| frontend/vite.config.js | React plugin, all-interface dev server, unrestricted hosts, /api proxy to localhost:8000 |
| frontend/vercel.json | Catch-all SPA rewrite; no backend API proxy |
| frontend/tailwind.config.js | Theme, font, shadow and source scanning configuration |
| frontend/postcss.config.js | Tailwind/Autoprefixer |
| frontend/src/main.jsx | React StrictMode entry; no AuthProvider |
| frontend/src/App.jsx | Active state, requests, profile selection, overlays, result conversion and PDF calls |
| frontend/src/App.test.jsx | Five passing cases with active children mocked |
| frontend/src/index.css | Global theme, Leaflet styling and animations |
| frontend/src/components/ControlDeck.jsx | Active origin modes, five gateways/four stations, class/speed/horizon/buffer controls |
| frontend/src/components/TelemetrySidebar.jsx | Active fuel/profile selection, metrics and nine layer toggles; contains sample values |
| frontend/src/components/Navbar.jsx | Active health labels, clock, refresh/report/PDF buttons; no auth controls |
| frontend/src/components/PolarMap.jsx | Active EPSG:3857 map, GeoJSON/vectors/paths, layer toggles and map coordinate input; delegates official iceberg display |
| frontend/src/components/OfficialIcebergLayer.jsx | Memoized route/viewport-filtered official iceberg dots; canvas renderer, 150-item cap, selected-item details/buffer/trail and display controls |
| frontend/src/components/RouteComparisonModal.jsx | Active metrics/report modal with PDF trigger |
| frontend/src/components/VisibleUI.test.jsx | Eighteen cases; nine pass/nine fail due to contract/mock drift and regressions |
| frontend/src/components/displayValues.js | Shared finite-number, duration and risk formatters |
| frontend/src/utils/icebergVisibility.js | Finite-coordinate, great-circle route-distance, dateline viewport and bounded display-selection helpers |
| frontend/src/utils/icebergVisibility.test.js | Focused display-filter and geometry tests |
| frontend/src/components/LoginModal.jsx | Unmounted sign-in/sign-up/demo UI |
| frontend/src/context/AuthContext.jsx | Unmounted local mock authentication/session context |
| frontend/src/components/StatusBar.jsx | Unmounted older footer |
| frontend/src/components/panels/LeftControls.jsx | Unmounted older controls, retained in tests |
| frontend/src/components/panels/DecisionSupport.jsx | Unmounted older metrics/XAI/PDF panel, retained in tests |
| frontend/src/components/panels/BottomStatusBar.jsx | Unmounted older status footer |
| frontend/src/components/panels/MapArea.jsx | Unmounted wrapper around map |
| frontend/src/utils/pdfGenerator.js | Active jsPDF report generator; unsupported assertions tracked in NAV-44 |

## Brain

Twelve documents after this update: README, PROJECT_OVERVIEW, ARCHITECTURE, API_REFERENCE, DEVELOPMENT, TESTING, KNOWN_ISSUES, CONTRIBUTING, FILE_INVENTORY, GIT_CHANGE_HISTORY, CHANGELOG and AUDIT_2026-09-24, all Markdown. [README.md](README.md) links their roles.

## Physical inventory at audit start

Counts include ignored/hidden files under the supplied application directory, after the frontend build. Counts are observations, not guaranteed repository contents.

| Category | Files | Review boundary |
| --- | ---: | --- |
| First-party/support excluding DB/Brain | 48 | 47 text/data/config files plus cloudflared executable |
| SQLite DB | 1 | Schema read-only; real data not modified |
| Brain | 11 | All reconciled; audit report adds a twelfth |
| .venv | 7,156 | Installed environment, classified only; dependency availability probed |
| Directories named venv | 8,037 | Combined local environments; classified only; dependency availability probed |
| frontend/node_modules | 12,885 | Installed dependencies; specific React-Leaflet updater inspected for NAV-46 |
| frontend/dist | 6 | Generated/rebuilt output |
| extensions | 814 | Editor/vendor resources |
| nodejs | 12 | Bundled runtime/tooling |
| __pycache__ outside environments | 5 | Generated bytecode |

## Parent Git-root support

The parent contains .gitignore, README.md, inspect_steps.py, scratch_prompt.txt and scratch_prompt_full.txt. These are outside the requested application directory. Parent ignore/history were checked; inspect_steps.py is a developer transcript-inspection helper with another machine's hardcoded path, not application runtime. Scratch prompts are not authoritative specifications or executable project code.

The parent ignore rule includes the DB, but the DB is already tracked; ignore rules do not untrack an existing file. This review changed only Brain documents.
