# Run, stop and reset

Current as of 27 September 2026. Captain login is required locally and publicly.

## Public site

Open https://polarnav-sih2026.netlify.app/ using credentials supplied privately by the owner. There is no signup. Render can take a few minutes to wake; restarting its backend invalidates sessions. Signing out does not stop the hosted service.

## Local setup and scripts

```powershell
cd 'C:\Users\prath\Downloads\SIH 2026\Project 2026\polar-navigation-dashboard\.antigravity'
.\Setup-Project.ps1
.\Start-Project.ps1
```

Setup installs backend/requirements-dev.txt into backend/venv and runs npm ci. Use a compatible Python environment (Render: 3.13.5; local verification: 3.14.4) and Node 22. Bundled nodejs is used when available. Installation and detailed map tiles need internet; backend datasets are bundled.

Open http://127.0.0.1:3000/ after readiness. Public health is http://127.0.0.1:8000/api/health . /docs, /redoc and /openapi.json are disabled; use [API_REFERENCE.md](API_REFERENCE.md).

Start checks ports 3000/8000, launches hidden processes, records process IDs/start times in .run, waits about 45 seconds for listening ports and then checks both services. Default graphs warm before the backend becomes ready. On slow machines the script may time out; inspect .run/backend-error.log and .run/frontend-error.log. Failure attempts to stop recorded processes.

```powershell
.\Stop-Project.ps1
```

Stop acts only on recorded IDs whose creation times match. It removes the process record, not datasets or planning settings.

## Manual terminals

Backend, from .antigravity:

```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --workers 1
```

Frontend in a separate terminal, from .antigravity:

```powershell
cd frontend
npm.cmd run dev -- --host 127.0.0.1 --strictPort
```

If Node is not on PATH, use `..\nodejs\node.exe node_modules/vite/bin/vite.js --host 127.0.0.1 --port 3000 --strictPort` from frontend. Ctrl+C stops each manually started server. Stop-Project controls only recorded script startup.

## Settings and troubleshooting

Reset demo restores planning defaults and recalculates; Sign out ends authentication. Planning values/waypoints persist separately in localStorage. Tokens use sessionStorage and expire or become invalid on backend restart. There is no live AIS or fixture reseeding.

Normally leave VITE_API_URL unset locally so Vite proxies /api. A hosted origin override instead contacts Render. VITE_PUBLIC_DEMO changes frontend waypoint behavior and deadlines. Do not put credentials in Vite variables.

Use Fit route after map exploration. Panning does not change the selected route; Map Click departure mode intentionally selects a new origin. Current minimum zoom depends on viewport size; iceberg/drift positions may overlap at overview scale.

See [TESTING.md](TESTING.md) for commands and [DEPLOYMENT.md](DEPLOYMENT.md) for hosting.
