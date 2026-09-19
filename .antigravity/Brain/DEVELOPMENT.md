# Development and deployment

Reviewed **2026-09-19**, baseline **2cc8271** (with PDF Export feature). Commands start in the application root unless stated. Review used backend/venv Python **3.14.4** and system Node **24.14.1**. Deployment files specify Python 3.10; that environment was not tested.

## Local setup on Windows

Backend terminal:

```powershell
Set-Location 'C:\Users\prath\Downloads\SIH 2026\Project 2026\polar-navigation-dashboard\.antigravity'
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

Frontend terminal:

```powershell
Set-Location 'C:\Users\prath\Downloads\SIH 2026\Project 2026\polar-navigation-dashboard\.antigravity\frontend'
npm.cmd install
npm.cmd run dev
```

Open http://localhost:3000. With VITE_API_URL unset/empty, App now uses relative /api URLs; Vite's development proxy targets localhost:8000. Remove an old environment value pointing elsewhere, or set the intended backend explicitly before starting Vite:

```powershell
$env:VITE_API_URL = 'http://localhost:8000'
npm.cmd run dev
```

Restart Vite after environment changes. Production values are embedded at build time. Run npm from frontend; frontend/package-lock.json is the active lockfile.

By default the backend runs in fast demo mode: route calculations use deterministic analytic wind/current/iceberg models and do not wait for external providers. The dashboard's OFFLINE/ONLINE toggle sends `data_mode=offline|online` for each route request. This avoids provider latency and rate limits during a presentation. `POLARNAV_LIVE_DATA=1` can also enable live mode as a process default; the request toggle is the preferred UI control. Live mode is slower and retains the provider/cache limitations documented in [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## PDF Report Export Setup

The PDF report generation is implemented client-side via `jspdf` and `jspdf-autotable` in `frontend/src/utils/pdfGenerator.js`. No additional backend services or binary CLI utilities are required for PDF export.

## Provider/cache requirements

Normal backend calculations now make external requests. Importing data_engine attempts to create backend/polar_nav_offline.db and needs write access. Empty cache plus unavailable weather produces route preflight 503 INITIAL_SYNC_REQUIRED; other endpoints have inconsistent handling.

There is no ingestion command, scheduled synchronization, offline-ready switch or public fixture-mode environment setting. The controlled test harness substitutes providers in process; it is not a runtime mode. Running database.py directly writes demonstration records to the default database, not production observations.

The SQLite path is defined in database.py, without an application environment override. Hosting files declare no persistent volume. Iceberg persistence, spatial/age validity and provenance remain incomplete; an existing database does not establish usable offline coverage. backtest_date is not wired through.

## Build and hosting

For a separately hosted backend, set its actual base URL before building from frontend:

```powershell
$env:VITE_API_URL = 'https://YOUR-BACKEND-HOST'
npm.cmd run build
npm.cmd run preview
```

Replace the placeholder with the real host. Build output is frontend/dist. Current vercel.json rewrites all paths to index.html and has no API proxy; the relative default therefore needs an explicit backend URL or a real same-origin proxy in split deployments.

| Target | Existing configuration |
| --- | --- |
| Render | Root .antigravity; pip install -r backend/requirements.txt; cd backend && uvicorn main:app --host 0.0.0.0 --port 10000; Python 3.10.0 |
| Docker | Context .antigravity; python:3.10-slim; copies backend into /app; serves port 10000 |
| Vercel | Root .antigravity/frontend; npm run build; output dist; configure VITE_API_URL or API proxy |

These are configuration facts, not verified deployments. No Docker build or hosted smoke test ran. Without .dockerignore, the backend copy can include local environments, caches and a database. Git ignore rules do not filter Docker context.

CORS allows all origins/methods/headers with credentials. Authentication, rate limits and an overall provider workload budget are absent. Graph/sample bounds do not bound total request latency. Esri tiles, Google Fonts and CDN Leaflet CSS need network access.

## Verification and troubleshooting

Use [TESTING.md](TESTING.md) for controlled backend reproduction. Normal backend scripts now invoke providers unless patched.

| Symptom | Explanation / action |
| --- | --- |
| npm test: Invalid URL | Fixed: Explicit base URL `'http://localhost'` added to `App.test.jsx:73`. All 37 Vitest cases pass. |
| INITIAL_SYNC_REQUIRED | Origin weather failed and no environmental snapshot was found. |
| Very slow route | Sequential provider calls per coordinate; TTL does not remove cold-request fanout. |
| /icebergs or /metocean 500 offline | Missing-cache ValueError lacks structured mapping. |
| Production HTML instead of JSON | Same-origin API request met SPA rewrite; configure backend base URL. |
| Invalid route settings | Bounds, class, nonidentical endpoints, longitude span and workload limits apply. |
| Missing backend module | Use --app-dir backend and install requirements in the running interpreter. |
| Offline banner disagrees with results | Origin-only provenance and stale frontend offline state are known issues. |
