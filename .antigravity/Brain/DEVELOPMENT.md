> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

# Development and deployment

## Current development entry points — 26 September 2026

Use Setup-Project.ps1, Start-Project.ps1 and Stop-Project.ps1 as documented in [RUNNING.md](RUNNING.md). requirements.txt now declares pyproj and pyshp; the historical missing-dependency workaround below is obsolete. Active runtime data is loaded locally by observed_data.py; retired provider/SQLite modules are not imported by main.py. The frontend requests online OpenStreetMap tiles.

Recent source work is in PolarMap.jsx, RouteComparisonModal.jsx, index.css and VisibleUI.test.jsx. Route rendering uses a dedicated SVG pane; report/map stacking is isolated. The attempted single-world maxBounds/noWrap change was reverted, including its test expectations. Do not reintroduce fixed world bounds without testing routes crossing the antimeridian and both narrow and wide viewports. GoogleEarthMap.jsx remains inactive. Existing deployment configurations have not been revalidated by this documentation update.

## Historical development notes below — superseded

Reviewed **2026-09-24**, code baseline **8bb44ea**.

## Location and prerequisites

Application root is `Project 2026/polar-navigation-dashboard/.antigravity`; the Git root is its parent. Backend is Python/FastAPI, frontend is Node/npm/Vite. Docker/Render specify Python 3.10; the inspected local backend environment uses Python 3.14.4. Several local venv directories exist, so use an explicit interpreter.

**Current startup blocker:** pathfinder.py imports pyproj but backend/requirements.txt does not declare it. Installing requirements alone does not complete setup. This review left application dependencies unchanged.

## Local setup

From the application directory, create a dedicated environment and install the declared dependencies. The additional pyproj install below is a temporary local workaround until the manifest/import is corrected.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
.\.venv\Scripts\python.exe -m pip install pyproj
Set-Location backend
..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

In another terminal, from frontend:

```powershell
npm.cmd ci
npm.cmd run dev
```

The dashboard is served at http://localhost:3000 and the API docs at http://localhost:8000/docs. These are run instructions, not a claim that this audit started a working service. Vite's current script/config listens on all interfaces and allows all hosts; adjust those settings if only local access is intended.

npm ci uses the committed lockfile. setup_node.py is an old optional bootstrap that downloads Node 20.18.0 and replaces a local nodejs directory; it is not necessary when Node/npm are already installed and was not run.

## Configuration that actually exists

- Frontend API override: build-time `VITE_API_URL`; default is page origin.
- Vite development proxy: /api -> http://localhost:8000.
- Backend DB: module-relative backend/polar_nav_offline.db, not an environment-configurable storage path.
- No current POLARNAV_LIVE_DATA gate, data_mode selector, auth secret configuration or implemented backtest_date.
- Provider calls occur automatically on relevant requests; fallback logic is internal.
- CORS is permissive in main.py; no authentication protects the endpoints.

Set VITE_API_URL before building a separately hosted frontend:

```powershell
$env:VITE_API_URL = 'https://your-backend.example'
npm.cmd run build
```

That URL is a placeholder. Configure the actual backend and confirm browser requests reach it.

## Database and imports

Importing data_engine initializes tables and overwrites the default vessel seed with a new timestamp. main.py also initializes a registry table. database.py defines a conflicting legacy registry schema but is unused by production. The runtime SQLite file is tracked in Git. Back it up and agree on a schema/data migration before changing persistence; avoid using real application data for tests.

The audit used a temporary DB before module imports and verified the real database stayed byte-identical. See [TESTING.md](TESTING.md).

## Hosting

Dockerfile copies backend/ into /app and serves uvicorn on 10000. There is no application .dockerignore, so local backend environments/database can enter the build context/image. The pyproj manifest gap blocks a clean runtime import.

render.yaml installs backend/requirements.txt and launches from backend on port 10000, assuming the service root is .antigravity. It configures no persistent disk.

frontend/vercel.json rewrites every path to index.html. Without an external VITE_API_URL or a real API rewrite, /api requests on split hosting can receive HTML. Vite's dev proxy is not included in a static production build.

No deployment or Docker execution was performed during this audit. Build success alone does not validate routing, feeds, authentication or PDF content.
