# File inventory and runtime status

Reconciled 27 September 2026. Paths are relative to .antigravity unless stated otherwise. This covers first-party/runtime roles, not every vendored binary or dependency file.

| Files/group | Current role |
|---|---|
| frontend/src/main.jsx | StrictMode entry; CaptainLogin wraps App |
| frontend/src/components/CaptainLogin.jsx; frontend/src/auth.js | Login/session gate, bearer transport, expiry and logout |
| frontend/src/App.jsx | Planning state, requests, result ownership, reset and report orchestration |
| frontend/src/components/Navbar.jsx | Source/health summary, horizon, Voyage report, recalculate, Sign out |
| frontend/src/components/ControlDeck.jsx | Departure, destination, vessel, speed, horizon and buffer |
| frontend/src/components/TelemetrySidebar.jsx | Fuel inputs, route cards, layers and export/analytics actions |
| frontend/src/components/PolarMap.jsx | Active Leaflet/OSM map, local fallback, routes and estimated overlays |
| frontend/src/components/OfficialIcebergLayer.jsx | Static iceberg icons, filters, locator, drift and lazy envelope |
| frontend/src/components/WrappedGeoJSON.jsx | Wrapped-world polygon positioning |
| frontend/src/components/RouteComparisonModal.jsx | Voyage report dialog and PDF actions |
| frontend/src/components/displayValues.js | Metric display helpers |
| frontend/src/utils/pdfGenerator.js | On-demand PDF generation |
| frontend/src/utils/mapViewport.js; icebergVisibility.js | Minimum zoom, wrapped coordinates and iceberg indexing/filtering |
| frontend/src/index.css | Dark map, responsive layout and stacking |
| backend/main.py | Planning/data API, auth dependency, public health, locks, CORS/gzip and warm-up |
| backend/captain_auth.py; captain_account.json | Provisioned verifier, sessions, login/logout and throttle |
| backend/observed_data.py | Source loading, provenance and calculated estimates |
| backend/observed_routes.py | Finite graph, hazard constraints, validation and results |
| backend/route_objectives.py | Directed metrics, objectives and overlap |
| backend/route_geometry.py | Land/shelf geometry and collision checks |
| backend/prepare_map.py | Preparation utility, not a request-time provider |
| backend/data/observed_icebergs.json; locations.json | Active iceberg and location metadata |
| backend/data/ne_10m_land.zip; map_base.geojson | Land obstacle input and display fallback |
| research/iceberg-data/byu_snapshot.geojson; usnic_shelf_2022.zip | Active reference/drift and shelf inputs |
| research/iceberg-data/* other files | Research downloads, hashes, inventories/scripts and history; not all runtime-loaded |
| Setup-Project.ps1; Start-Project.ps1; Stop-Project.ps1 | Local setup/process lifecycle |
| backend/requirements.txt; requirements-dev.txt | Local/development dependencies including retained legacy stack |
| backend/requirements-deploy.txt | Pinned active deployment requirements |
| frontend/package.json; package-lock.json; vite.config.js | Dependencies/scripts and local API proxy |
| frontend/scripts/check-deployment.mjs; frontend/.env.example | Hosted API-origin validation and non-secret config example |
| render.yaml; repository-root netlify.toml | Current hosting definitions |

## Tests

Active backend suites: test_observation_demo.py, test_route_objectives.py, test_captain_auth.py. Seven frontend files: App.test.jsx; components/{VisibleUI,RouteAvailability,CaptainLogin}.test.jsx; utils/{icebergVisibility,mapViewport,pdfGenerator}.test.js. See [TESTING.md](TESTING.md).

## Retained inactive or unsupported paths

- Frontend: context/AuthContext.jsx, components/{LoginModal,GoogleEarthMap,StatusBar}.jsx and components/panels/*.jsx. Presence does not imply active login/globe/panel behavior.
- Backend: data_engine.py, database.py, drift_engine.py, pathfinder.py, demo_passages.py, navigation_geometry.py, old verification scripts/response fixture and tests outside the three active suites. They are not the active production engine.
- Dockerfile and frontend/vercel.json are not the deployed configuration. Dockerfile omits required sibling research files.
- Historical SQLite, bundled Node/editor extensions and research CSV archives remain. No repository cleanup occurred in this documentation pass.

## Local/generated/private files

node_modules, dist, backend/venv, .run logs/PIDs/screenshots, local env files and user_vessel_fixes.json are not deployment source. .env.captain is an ignored plaintext recovery copy; captain_account.json is the backend salted verifier. Never publish the recovery copy. Ignore rules do not remove files already tracked historically.

All 19 current Brain entries are indexed in [README.md](README.md). Their previous complete text is preserved under archive/before-2026-09-27-reconciliation with explicit historical status.
