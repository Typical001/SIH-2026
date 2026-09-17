# File inventory

Snapshot: **2026-09-17**, committed baseline **3684d67** plus uncommitted NAV-01/02/06 repairs. Paths below are application-root-relative (`.antigravity`). Initial Git status was clean; the current local restoration modifies application/test/package files and the eleven Brain documents (see CHANGELOG). Source/configuration/tests were read; vendor/binary/dependency files were inventoried as support artifacts, not audited internally.

## Application and root support files

All **33** current source/data/configuration/root-support files are accounted for below. This count includes cloudflared.exe as a supporting binary, not source code. All are tracked; files changed by the local restoration are marked below.

| Path | Git tracking | Current role |
| --- | --- | --- |
| `.gitignore` | Tracked | Ignore rules for node_modules and dist; no Python cache/environment patterns. |
| `Dockerfile` | Tracked | Python 3.10 backend container serving port 10000. |
| `argv.json` | Tracked | Editor runtime/crash-reporting settings, not application configuration. |
| `backend/data_engine.py` | Tracked | 12 static icebergs, six stations/ports and analytic metocean fields. |
| `backend/drift_engine.py` | Tracked | Hourly drift, snapshots, terminal position and hand-sampled buffer polygon. |
| `backend/main.py` | Tracked; modified locally | Five GET endpoints, CORS, successful XAI responses and restored HTTP 409 / NO_ROUTE_FOUND handler. |
| `backend/pathfinder.py` | Tracked; modified locally | Land mask, graph, A*, metrics and explanations; NoRouteFoundError prevents fallback success. |
| `backend/requirements.txt` | Tracked | Eight minimum-version Python requirements; no lockfile. |
| `backend/response.json` | Tracked | 129,269-byte saved JSON sample; 76 waypoints/12 icebergs, no xai_explanation; not used by app/tests. |
| `backend/test_backend.py` | Tracked | Three original direct engine checks; passed September 17. |
| `backend/test_no_route.py` | Tracked; modified locally | Five passing engine/ASGI cases; includes no-XAI-on-failure and XAI-on-success assertions. |
| `cloudflared.exe` | Tracked | Bundled tunnel executable; no application invocation found; not executed in review. |
| `frontend/index.html` | Tracked | SPA entry HTML, CDN Leaflet CSS and Google Fonts. |
| `frontend/package-lock.json` | Tracked; modified locally | Lockfile v3; restored pinned test packages and their dependency graph. |
| `frontend/package.json` | Tracked; modified locally | dev/build/preview/test scripts; Vitest and React Test Renderer declared at exact versions. |
| `frontend/postcss.config.js` | Tracked | Tailwind/Autoprefixer pipeline. |
| `frontend/src/App.jsx` | Tracked; modified locally | Panel composition, scalar fetch dependencies, cancellation/ownership, result clearing, validation, Retry, XAI and clock. |
| `frontend/src/App.test.jsx` | Tracked; modified locally | Twenty component cases adapted to LeftControls and the actual new result panels, including clock/XAI/chart/JSON races. |
| `frontend/src/components/Navbar.jsx` | Tracked; modified locally | Header, placeholder tabs/profile, Analytics action and loading banner; fallback claim removed. |
| `frontend/src/components/PolarMap.jsx` | Tracked | Leaflet tiles, route lines, markers, circles, popups and straight drift trails; unchanged by redesign. |
| `frontend/src/components/RouteComparisonModal.jsx` | Tracked; modified locally | Comparison report with restored missing-results guard; fixed success-path baseline claims remain. |
| `frontend/src/components/StatusBar.jsx` | Tracked | Unused alternative footer. |
| `frontend/src/components/panels/BottomStatusBar.jsx` | Tracked; modified locally | Mounted footer with calculating/result availability, simulation label and UTC clock. |
| `frontend/src/components/panels/DecisionSupport.jsx` | Tracked; modified locally | Loading/empty states or successful metrics/explanation/comparison/chart/alerts; metric fixture removed. |
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
- dccfa3b restored all eleven Brain documents, backend/test_no_route.py and frontend/src/App.test.jsx exactly as stored in 6097e6c. That commit did not restore test infrastructure or implementation guarantees; the current working-tree repair now does.
- Four Python 3.13 bytecode files replaced four Python 3.14 files in c996de7; four older 3.11 cache files remain. These are generated artifacts, not additional backend modules.

## Physical inventory by category

Counts include hidden/ignored files and were refreshed after the production build. Git metadata is in the parent repository and excluded. Environment/dependency counts describe this laptop, not what a fresh clone installs.

| Category | Files | Bytes |
| --- | ---: | ---: |
| `Brain` | 11 | Not fixed: documentation edited during restoration |
| `application and root support files` | 33 | 55256442 |
| `backend/__pycache__` | 8 | 103856 |
| `backend/venv` | 7150 | 243864718 |
| `extensions root metadata` | 1 | 4472 |
| `extensions/redhat.java-1.55.0-win32-x64` | 584 | 172793875 |
| `extensions/vscjava.vscode-gradle-3.18.0-universal` | 87 | 36203245 |
| `extensions/vscjava.vscode-java-debug-0.59.0-universal` | 29 | 3514484 |
| `extensions/vscjava.vscode-java-dependency-0.27.6-universal` | 22 | 251271 |
| `extensions/vscjava.vscode-java-pack-0.31.1-universal` | 48 | 6677457 |
| `extensions/vscjava.vscode-java-test-0.46.0-universal` | 43 | 5268604 |
| `frontend/dist` | 3 | 382973 |
| `frontend/node_modules` | 7982 | 127984944 |
| `nodejs` | 12 | 70027615 |

## Dependency and sample inspection

frontend/package-lock.json contains 253 package entries including root. It resolves React 18.3.1, Vite 5.4.21 and React Vite plugin 4.7.0. Vitest 4.1.11 and React Test Renderer 18.3.1 are restored at exact versions in manifest/lockfile and installed locally. npm test runs twenty passing component cases. npm install changed local dependency artifacts; no isolated clean-install check was performed. The three-file production dist was regenerated and remains ignored.

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
