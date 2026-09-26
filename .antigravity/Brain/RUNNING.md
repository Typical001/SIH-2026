# Run and stop PolarNav

Open PowerShell in:

```powershell
cd 'C:\Users\prath\Downloads\SIH 2026\Project 2026\polar-navigation-dashboard\.antigravity'
```

First-time setup requires Python 3.11+ and Node.js 20.19+ (Node 22 preferred). A bundled nodejs folder is used when available. Installation requires internet; normal execution uses local data.

```powershell
.\Setup-Project.ps1
```

Start:

```powershell
.\Start-Project.ps1
```

Open http://127.0.0.1:3000/. Backend API documentation: http://127.0.0.1:8000/docs. Initial graph warm-up takes several seconds before the start script reports ready. Startup checks both services and refuses occupied ports instead of silently using another port. Logs are under .run/.

Stop:

```powershell
.\Stop-Project.ps1
```

This stops only recorded process IDs whose creation times still match, including the backend interpreter child. It leaves datasets and saved settings intact. Scripts do not require visible terminal windows for the running services.

## Manual terminals

Backend terminal, from .antigravity:

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Frontend terminal, separately from .antigravity:

```powershell
cd frontend
npm run dev -- --host 127.0.0.1 --strictPort
```

Press Ctrl+C in both terminals to stop manually started servers. Stop-Project.ps1 only controls processes started/recorded by Start-Project.ps1.

Use the dashboard's Reset demo button to restore planning defaults. Browser inputs and explicitly saved vessel waypoints otherwise persist. There is no automatic fixture reseeding or live AIS connection.

## Recent map behavior — 26 September 2026

Refresh the browser after frontend updates and use Fit route to restore the selected passage. Horizontal wrapping is restored after the single-world restriction was reverted; repeated continents can appear at low zoom. The report stacking and SVG route fixes remain active. Backend observations/routing are local; detailed OpenStreetMap tiles need internet. Wait for the start script to report readiness before reloading: the frontend can load before backend graph warm-up finishes and temporarily show a request error.

## Checks

```powershell
.\backend\venv\Scripts\python.exe -m unittest discover -s backend -p test_observation_demo.py -v
.\backend\venv\Scripts\python.exe -m unittest discover -s backend -p test_route_objectives.py -v
cd frontend
npm test
npm run build
```

The current backend suites are test_observation_demo.py and test_route_objectives.py. Older backend test files target the retired live/fixture engines and are historical diagnostic code, not the current runtime acceptance suite. The deployed frontend/API and export are covered by the current tests.
