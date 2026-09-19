# File inventory

Reviewed **2026-09-19**, baseline **2cc8271** (with PDF Export feature), application root `.antigravity`. All 38 application-owned text/source/data/configuration files were reviewed or parsed, plus the 11 Brain documents. The cloudflared binary is the 39th application/support artifact.

## Application and support files

| Path | Tracking | Current role |
| --- | --- | --- |
| `.gitignore` | Tracked | Application ignore rules: node_modules and repeated dist patterns. |
| `Dockerfile` | Tracked | Python 3.10 backend image, copies backend, port 10000; no .dockerignore. |
| `argv.json` | Tracked | Editor runtime/crash-report settings (JSON with comments), not app configuration. |
| `backend/data_engine.py` | Tracked | External forecast/archive/marine/catalog requests; analytic helpers; 300-second caches; SQLite calls. Missing json import in iceberg writes. |
| `backend/database.py` | Tracked | New SQLite tables and snapshot helpers; import-time caller initialization; unbounded-age/global environmental fallback. |
| `backend/drift_engine.py` | Tracked | Hourly weighted-vector drift; snapshots, final buffer polygon and endpoint displacement. |
| `backend/main.py` | Tracked | Five GET handlers, validation, 409/422/route-preflight 503, origin-preflight metadata, unused backtest_date. |
| `backend/navigation_geometry.py` | Tracked | Spherical distances/bearings, <=5 km great-circle interpolation and minimum minor-arc distance. |
| `backend/pathfinder.py` | Tracked | Directed A*, known-land/segment checks, swept forecast circles, metrics and sampled explanation. |
| `backend/requirements.txt` | Tracked | Eight minimum-version requirements; no Python lockfile. |
| `backend/response.json` | Tracked | Unused historical 129269-byte JSON; 76 waypoints, 12 initial/predicted icebergs; missing new contract fields. |
| `backend/test_backend.py` | Tracked | Three original pipeline checks; still assumes deterministic catalog/weather. |
| `backend/test_no_route.py` | Tracked | Five engine/ASGI no-route/success tests; preflight now needs provider isolation. |
| `backend/test_route_correctness.py` | Tracked | Nineteen adversarial input, geometry, graph, metrics, vessel and horizon tests. |
| `cloudflared.exe` | Tracked | Tracked tunnel binary; not invoked by app, not executed/audited internally. |
| `frontend/index.html` | Tracked | SPA entry, Google Fonts and CDN Leaflet CSS. |
| `frontend/package-lock.json` | Tracked | Lockfile v3 with 277 package entries including jsPDF dependencies. |
| `frontend/package.json` | Tracked | dev/build/preview/test scripts and runtime/dev dependencies (added jsPDF, jspdf-autotable). |
| `frontend/postcss.config.js` | Tracked | Tailwind and Autoprefixer. |
| `frontend/src/App.jsx` | Tracked | State/request ownership, result clearing/errors, relative API default, offline metadata; passes report parameters to modals. |
| `frontend/src/App.test.jsx` | Tracked | Twenty-one App cases; test URL construction updated with base URL. |
| `frontend/src/components/Navbar.jsx` | Tracked | Planner/Forecast navigation, Analytics report trigger, loading/offline banners. |
| `frontend/src/components/PolarMap.jsx` | Tracked | EPSG:3857 map, supplied geometry/trails, independent layers, illustrative ice circles and planning envelopes. |
| `frontend/src/components/RouteComparisonModal.jsx` | Tracked | Missing-result guard, returned metrics comparison, Export PDF Report button. |
| `frontend/src/components/StatusBar.jsx` | Tracked | Unused older footer. |
| `frontend/src/components/VisibleUI.test.jsx` | Tracked | Fifteen passing controls/map/comparison/coverage/rendering cases with mocked Leaflet. |
| `frontend/src/components/displayValues.js` | Tracked | Finite-number formatting, rounded duration rollover and risk labels. |
| `frontend/src/components/panels/BottomStatusBar.jsx` | Tracked | Mounted simulation/result-availability footer and UTC clock. |
| `frontend/src/components/panels/DecisionSupport.jsx` | Tracked | Loading/empty/results, XAI dialog, chart gaps, baseline comparison, Quick Export PDF action button. |
| `frontend/src/components/panels/LeftControls.jsx` | Tracked | Presets, 13 Indian ports, vessel/horizon controls, layer toggles; metocean disabled. |
| `frontend/src/components/panels/MapArea.jsx` | Tracked | Thin PolarMap wrapper. |
| `frontend/src/utils/pdfGenerator.js` | Untracked/New | Client-side jsPDF utility for generating official 5-section bridge execution reports with PolarNav Engine branding. |
| `frontend/src/index.css` | Tracked | Global theme, glass panels, Leaflet overrides, route/radar animations. |
| `frontend/src/main.jsx` | Tracked | React root under StrictMode. |
| `frontend/tailwind.config.js` | Tracked | Source scanning, palette, fonts and shadows. |
| `frontend/vercel.json` | Tracked | All-path SPA rewrite; no API proxy. |
| `frontend/vite.config.js` | Tracked | React plugin; port 3000; /api proxy to localhost:8000. |
| `render.yaml` | Tracked | Backend build/start commands; Python 3.10.0; application-root assumption; no persistent disk. |
| `setup_node.py` | Tracked | Downloads Node 20.18.0 and replaces nodejs; inspected, not run. |

## Documentation

Eleven current files: README.md, PROJECT_OVERVIEW.md, ARCHITECTURE.md, API_REFERENCE.md, DEVELOPMENT.md, TESTING.md, KNOWN_ISSUES.md, CONTRIBUTING.md, FILE_INVENTORY.md, GIT_CHANGE_HISTORY.md and CHANGELOG.md. Their roles are linked from [README.md](README.md).

## Physical inventory

Counts include hidden/ignored files inside the application tree, after the frontend build.

| Category | Files | Bytes |
| --- | ---: | ---: |
| `Brain` | 11 | Variable |
| `application/support` | 39 | 55305000 |
| `backend/__pycache__` | 12 | 163051 |
| `backend/venv` | 7150 | 243864718 |
| `frontend/dist` | 6 | 1200000 |
| `frontend/node_modules` | 8006 | 132000000 |

## Parent Git-root support files

- `.gitignore`: ignores backend venv/bytecode/DB patterns.
- `README.md`: UTF-16 heading SIH-2026.
- `tatus --short`: 902 lines of ANSI diff dump.

## Structure changes in current update

- Added `frontend/src/utils/pdfGenerator.js` for client-side PDF export.
- Modified `App.jsx`, `RouteComparisonModal.jsx`, `DecisionSupport.jsx`, `App.test.jsx`, `package.json`, `package-lock.json`.
