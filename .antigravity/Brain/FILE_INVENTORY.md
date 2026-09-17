# File inventory

Snapshot: **2026-09-17**, committed source baseline **dccfa3b**. Paths below are application-root-relative (`.antigravity`). Initial Git status was clean; the only tracked modifications from this review are the eleven Brain documents. Source/configuration/tests were read; vendor/binary/dependency files were inventoried as support artifacts, not audited internally.

## Application and root support files

All **33** current source/data/configuration/root-support files are accounted for below. This count includes cloudflared.exe as a supporting binary, not source code. All are tracked.

| Path | Git tracking | Current role |
| --- | --- | --- |
| `.gitignore` | Tracked | Ignore rules for node_modules and dist; no Python cache/environment patterns. |
| `Dockerfile` | Tracked | Python 3.10 backend container serving port 10000. |
| `argv.json` | Tracked | Editor runtime/crash-reporting settings, not application configuration. |
| `backend/data_engine.py` | Tracked | 12 static icebergs, six stations/ports and analytic metocean fields. |
| `backend/drift_engine.py` | Tracked | Hourly drift, snapshots, terminal position and hand-sampled buffer polygon. |
| `backend/main.py` | Tracked | Five GET endpoints, validation, CORS and route response including xai_explanation; no 409 handler. |
| `backend/pathfinder.py` | Tracked | Land mask, weighted graph, A*, fallback interpolation, metrics and heuristic explanations. |
| `backend/requirements.txt` | Tracked | Eight minimum-version Python requirements; no lockfile. |
| `backend/response.json` | Tracked | 129,269-byte saved JSON sample; 76 waypoints/12 icebergs, no xai_explanation; not used by app/tests. |
| `backend/test_backend.py` | Tracked | Three original direct engine checks; passed September 17. |
| `backend/test_no_route.py` | Tracked | Five restored engine/ASGI cases; fails import of removed NoRouteFoundError. |
| `cloudflared.exe` | Tracked | Bundled tunnel executable; no application invocation found; not executed in review. |
| `frontend/index.html` | Tracked | SPA entry HTML, CDN Leaflet CSS and Google Fonts. |
| `frontend/package-lock.json` | Tracked | Lockfile v3; 191 package entries including root; test packages removed. |
| `frontend/package.json` | Tracked | dev/build/preview scripts and dependencies; no test script or test-runner declarations. |
| `frontend/postcss.config.js` | Tracked | Tailwind/Autoprefixer pipeline. |
| `frontend/src/App.jsx` | Tracked | Panel composition, route state/fetch, XAI and one-second clock; request/error guards regressed. |
| `frontend/src/App.test.jsx` | Tracked | Restored fourteen component cases with obsolete ControlDeck mock and request/UI assumptions. |
| `frontend/src/components/Navbar.jsx` | Tracked | Header, placeholder tabs/profile, Analytics action, loading/fallback banner. |
| `frontend/src/components/PolarMap.jsx` | Tracked | Leaflet tiles, route lines, markers, circles, popups and straight drift trails; unchanged by redesign. |
| `frontend/src/components/RouteComparisonModal.jsx` | Tracked | Comparison report with fixed baseline claims; no missing-results guard. |
| `frontend/src/components/StatusBar.jsx` | Tracked | Unused alternative footer. |
| `frontend/src/components/panels/BottomStatusBar.jsx` | Tracked | Mounted footer with fixed online/safe statuses and App clock. |
| `frontend/src/components/panels/DecisionSupport.jsx` | Tracked | Metric fixture fallback, heuristic explanation dialog, comparison, mean drift-speed chart and alerts. |
| `frontend/src/components/panels/LeftControls.jsx` | Tracked | Preset/port/class/horizon selectors, full-route calculation buttons and eight layer toggles. |
| `frontend/src/components/panels/MapArea.jsx` | Tracked | Thin PolarMap wrapper. |
| `frontend/src/index.css` | Tracked | Global styling, glass panels, Leaflet overrides and animations. |
| `frontend/src/main.jsx` | Tracked | ReactDOM entry with StrictMode. |
| `frontend/tailwind.config.js` | Tracked | Content paths, palette/fonts/shadows; no dynamic-class safelist. |
| `frontend/vercel.json` | Tracked | SPA rewrite; no backend proxy. |
| `frontend/vite.config.js` | Tracked | React plugin, port 3000, host configuration and development API proxy. |
| `render.yaml` | Tracked | Backend service commands, application-root assumption and Python 3.10.0. |
| `setup_node.py` | Tracked | Downloads Node 20.18.0 and replaces portable nodejs; not run during review. |

## Removed and restored paths

- c996de7 removed ControlDeck.jsx and TelemetrySidebar.jsx; the new panel components replace their roles. Manual-coordinate and safety-buffer controls were not carried forward.
- The unused application-root package-lock.json was deleted; frontend/package-lock.json remains.
- dccfa3b restored all eleven Brain documents, backend/test_no_route.py and frontend/src/App.test.jsx exactly as stored in 6097e6c. Test infrastructure and implementation guarantees were not restored.
- Four Python 3.13 bytecode files replaced four Python 3.14 files in c996de7; four older 3.11 cache files remain. These are generated artifacts, not additional backend modules.

## Physical inventory by category

Counts include hidden/ignored files and were refreshed after the production build. Git metadata is in the parent repository and excluded. Environment/dependency counts describe this laptop, not what a fresh clone installs.

| Category | Files | Bytes |
| --- | ---: | ---: |
| `Brain` | 11 | Not fixed: documentation edited during review |
| `application and root support files` | 33 | 55211999 |
| `backend/__pycache__` | 8 | 103856 |
| `backend/venv` | 7150 | 243864718 |
| `extensions root metadata` | 1 | 4472 |
| `extensions/redhat.java-1.55.0-win32-x64` | 584 | 172793875 |
| `extensions/vscjava.vscode-gradle-3.18.0-universal` | 87 | 36203245 |
| `extensions/vscjava.vscode-java-debug-0.59.0-universal` | 29 | 3514484 |
| `extensions/vscjava.vscode-java-dependency-0.27.6-universal` | 22 | 251271 |
| `extensions/vscjava.vscode-java-pack-0.31.1-universal` | 48 | 6677457 |
| `extensions/vscjava.vscode-java-test-0.46.0-universal` | 43 | 5268604 |
| `frontend/dist` | 3 | 381387 |
| `frontend/node_modules` | 7982 | 128054888 |
| `nodejs` | 12 | 70027615 |

## Dependency and sample inspection

frontend/package-lock.json contains 191 package entries including the root. It resolves React 18.3.1, Vite 5.4.21 and React Vite plugin 4.7.0. Neither Vitest nor React Test Renderer is declared or locked, although both remain in this laptop's existing node_modules. No dependency installation/pruning was performed. The three-file production dist was regenerated and remains ignored.

backend/response.json was parsed as a complete JSON object. It contains Cape Town–Bharati, a 72-hour horizon, 76 route waypoints, 12 initial/predicted icebergs and route metrics, but lacks xai_explanation. It is not imported by application code/tests and is not a valid substitute for checking the current API response. Provenance and capture time are not established by the file.

## Bundled editor extensions

| Extension | Version | Role |
| --- | --- | --- |
| redhat.java | 1.55.0 | Java language tooling and bundled JRE |
| vscjava.vscode-gradle | 3.18.0 | Gradle tooling |
| vscjava.vscode-java-debug | 0.59.0 | Java debugger |
| vscjava.vscode-java-dependency | 0.27.6 | Java project/dependency tooling |
| vscjava.vscode-java-pack | 0.31.1 | Java extension pack |
| vscjava.vscode-java-test | 0.46.0 | Java test tooling |

Metadata under extensions was inspected for classification; vendor documentation, licenses and binary internals are not first-party application code. Their presence does not indicate a Java backend. Portable Node support files and cloudflared remain bundled; the build used the system Node installation, not setup_node.py.

## Inspection boundaries

All application-owned Python/JSX/JS/CSS/HTML/configuration and the eleven Brain documents were reread. JSON sample/lockfiles were parsed as data. Installed environments, dependencies, generated caches and binaries were categorized and counted rather than line-by-line reviewed. No first-party AGENTS.md, license or CI workflow was found in the scoped source scan. Git includes vendor files and bytecode that ignore rules alone cannot untrack.

To refresh this inventory, compare physical files with git ls-files: ignored/untracked artifacts only appear in the former. Changes since the September 14 snapshot and the exact committed paths are recorded in [CHANGELOG.md](CHANGELOG.md) and [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md).
