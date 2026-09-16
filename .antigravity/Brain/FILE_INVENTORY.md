# File inventory

Snapshot: 2026-09-14. Paths are relative to `.antigravity`. All physical files at the refreshed inventory snapshot are included in the category counts below. Application-owned source/configuration was read; third-party and binary contents were inventoried, not individually audited. Git metadata lives in the parent directory and is outside this inventory.

## Application and root support files

| Path | Git tracking | Current role |
| --- | --- | --- |
| `.gitignore` | Tracked | Ignore patterns for node_modules and dist (dist repeated). |
| `Dockerfile` | Tracked | Backend Python container definition. |
| `argv.json` | Tracked | Editor runtime/crash-reporting configuration; not app configuration. |
| `backend/data_engine.py` | Tracked | Iceberg catalog, station catalog and synthetic metocean fields. |
| `backend/drift_engine.py` | Tracked | Hourly iceberg forecasts and final safety buffer geometry. |
| `backend/main.py` | Tracked; modified locally | FastAPI service, CORS and five application endpoints. |
| `backend/pathfinder.py` | Tracked; modified locally | Land mask, weighted graph, A* routing and route metrics. |
| `backend/requirements.txt` | Tracked | Eight minimum-version Python requirements. |
| `backend/test_backend.py` | Tracked | Three direct engine tests; executable as a script. |
| `backend/test_no_route.py` | Untracked | Five engine/ASGI no-route and success tests. |
| `cloudflared.exe` | Tracked | Bundled tunnel executable; no application invocation found. |
| `frontend/index.html` | Tracked | SPA HTML, CDN Leaflet CSS and Google Fonts. |
| `frontend/package-lock.json` | Tracked; modified locally | Resolved frontend dependency graph. |
| `frontend/package.json` | Tracked; modified locally | Frontend dependencies and dev/build/preview/test scripts. |
| `frontend/postcss.config.js` | Tracked | Tailwind and Autoprefixer pipeline. |
| `frontend/src/App.jsx` | Tracked; modified locally | Request cancellation, validation, results, errors and no-route handling. |
| `frontend/src/App.test.jsx` | Untracked | Fourteen component request/error/no-route regression tests. |
| `frontend/src/components/ControlDeck.jsx` | Tracked | Port search, manual origin, presets, class and sliders. |
| `frontend/src/components/Navbar.jsx` | Tracked | Clock, branding, fixed feed statuses and actions. |
| `frontend/src/components/PolarMap.jsx` | Tracked | Map, external tiles, route geometry and iceberg overlays. |
| `frontend/src/components/RouteComparisonModal.jsx` | Tracked; modified locally | Route comparison dialog with empty-state handling; some fixed baseline values remain. |
| `frontend/src/components/TelemetrySidebar.jsx` | Tracked; modified locally | Telemetry with loading/empty states; fixture fallback removed locally. |
| `frontend/src/index.css` | Tracked | Global styles, glass panels, Leaflet overrides and animations. |
| `frontend/src/main.jsx` | Tracked | React StrictMode entry point. |
| `frontend/tailwind.config.js` | Tracked | Content paths, polar colors, typography and shadows. |
| `frontend/vercel.json` | Tracked | Catch-all SPA rewrite; no backend proxy. |
| `frontend/vite.config.js` | Tracked | React plugin, dev host/port and localhost API proxy. |
| `package-lock.json` | Untracked | Untracked empty root npm lock; frontend has the actual manifest. |
| `render.yaml` | Tracked | Backend service configuration assuming application root. |
| `setup_node.py` | Tracked | Downloads Node 20.18.0 and replaces the portable nodejs directory. |

## Physical inventory by category

Counts refreshed during the documentation re-review after local NAV fixes and regression tests. There are eleven Markdown files under `Brain/`. Generated/dependency counts can change after installs, builds or tests.

| Category | Files | Bytes |
| --- | ---: | ---: |
| `application and root support files` | 30 | 55118607 |
| `backend/__pycache__ (generated Python bytecode)` | 8 | 109787 |
| `backend/venv (local Python environment)` | 7150 | 243864718 |
| `extensions root metadata` | 1 | 4472 |
| `extensions/redhat.java-1.55.0-win32-x64` | 584 | 172793875 |
| `extensions/vscjava.vscode-gradle-3.18.0-universal` | 87 | 36203245 |
| `extensions/vscjava.vscode-java-debug-0.59.0-universal` | 29 | 3514484 |
| `extensions/vscjava.vscode-java-dependency-0.27.6-universal` | 22 | 251271 |
| `extensions/vscjava.vscode-java-pack-0.31.1-universal` | 48 | 6677457 |
| `extensions/vscjava.vscode-java-test-0.46.0-universal` | 43 | 5268604 |
| `frontend/dist (generated build)` | 3 | 381701 |
| `frontend/node_modules (installed dependencies)` | 7982 | 128054888 |
| `nodejs (portable runtime and support files)` | 12 | 70027615 |
| `project Markdown documentation` | 11 | Not fixed: documents are being edited |

## Bundled editor extensions

| Extension | Version | Purpose |
| --- | --- | --- |
| `java` | 1.55.0 | Java Linting, Intellisense, formatting, refactoring, Maven/Gradle support and more... |
| `vscode-gradle` | 3.18.0 | Manage Gradle Projects, run Gradle tasks and provide better Gradle file authoring experience in VS Code |
| `vscode-java-debug` | 0.59.0 | A lightweight Java debugger for Visual Studio Code |
| `vscode-java-dependency` | 0.27.6 | %description% |
| `vscode-java-pack` | 0.31.1 | Popular extensions for Java development that provides Java IntelliSense, debugging, testing, Maven/Gradle support, project management and more |
| `vscode-java-test` | 0.46.0 | %description% |

Descriptions beginning with `%` are localization keys in vendor manifests. Java/Gradle/debug/test extensions are editor support, not evidence that the application uses Java. Vendor documentation and licenses remain in their own directories.

## Inspection boundaries

- Node runtime binaries, cloudflared, extension binaries and bytecode were not executed for inspection or reverse engineered.
- Lockfiles were inspected as dependency metadata; vendor source was not treated as first-party project logic.
- The existing installed Vite toolchain was used for a production build.
- No first-party AGENTS.md, license, CI workflow or additional application service was found in the inspected project.
- Generated dist and node_modules are ignored; some vendor files and older bytecode are already tracked, so ignore rules do not remove them from Git.

To refresh inventory, enumerate physical files separately from `git ls-files`; the latter omits untracked/generated files and can include tracked vendor artifacts.

The existing `backend/venv` is local installed Python tooling, not application source; its packages and nested caches are accounted for separately above. It was inspected as an environment rather than audited as first-party code.

## Current local additions and modifications

All eleven project documents reside in `Brain/`. Paths in the source table are relative to `.antigravity`. “Tracked” means present in Git, not necessarily unchanged; the current modifications are marked explicitly.

The main table includes the new frontend component test and backend no-route test files. The refreshed category counts include installed test dependencies and existing generated output. Step-by-step NAV-01, NAV-06 and NAV-02 additions, modifications and removals remain in [CHANGELOG.md](CHANGELOG.md), rather than duplicated as older inventory notes.
