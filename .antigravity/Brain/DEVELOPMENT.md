# Development and deployment

## Local setup on Windows

Use two PowerShell terminals. Commands below start from the application directory. Python dependencies require installation into the interpreter actually running the backend. Deployment files specify Python 3.10; no complete supported-version matrix has been tested.

```powershell
Set-Location 'C:\Users\prath\Downloads\SIH 2026\Project 2026\polar-navigation-dashboard\.antigravity'
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
```

Frontend terminal, using an installed Node.js and npm:

```powershell
Set-Location 'C:\Users\prath\Downloads\SIH 2026\Project 2026\polar-navigation-dashboard\.antigravity\frontend'
npm.cmd ci
$env:VITE_API_URL = 'http://localhost:8000'
npm.cmd run dev
```

Open `http://localhost:3000`. Use a nonempty `VITE_API_URL`: the `||` fallback in `App.jsx` sends an empty/unset value to the embedded Render address. Vite's `/api` development proxy exists, but current absolute fetch URLs bypass it. Environment changes require restarting Vite; production values are embedded at build time.

This checkout also contains an existing `backend/venv` whose Python interpreter passed the backend test script during review. To reuse it locally, substitute `.\backend\venv\Scripts\python.exe` for `.\.venv\Scripts\python.exe` in backend commands. A new environment remains the reproducible setup approach for a fresh checkout.

The root `package-lock.json` has no packages and no matching root package.json. Run npm from `frontend`. The project also includes a portable `nodejs/node.exe`; `setup_node.py` downloads Node 20.18.0 and replaces that directory. Inspect the script before using it because it recursively removes an existing `nodejs` directory. It is not required when Node is already installed.

## Build and preview

From `frontend`:

```powershell
$env:VITE_API_URL = 'http://localhost:8000'
npm.cmd run build
npm.cmd run preview
```

Build output is `frontend/dist`; the preview command prints its URL. Preview serves static assets and still needs the configured API. Esri tiles, Google Fonts and Leaflet CDN CSS also require network access.

## Existing deployment configuration

These are repository configuration instructions, not evidence of a verified deployment.

| Target | Application-root setting / commands |
| --- | --- |
| Render backend | Root `.antigravity`; build `pip install -r backend/requirements.txt`; start `cd backend && uvicorn main:app --host 0.0.0.0 --port 10000` |
| Docker backend | Build context `.antigravity`; Dockerfile copies backend into `/app` and serves port 10000 |
| Vercel frontend | Root `.antigravity/frontend`; build `npm run build`; output `dist`; configure `VITE_API_URL` to the backend base URL |

`render.yaml` declares Python 3.10.0 and assumes the application directory as its working root. A service launched at the parent Git root will not find `backend/requirements.txt` without a root-directory adjustment. `frontend/vercel.json` rewrites all paths to index.html; it does not proxy API requests.

Example local container commands, from the application root:

```powershell
docker build -t polarnav-backend .
docker run --rm -p 10000:10000 polarnav-backend
```

Backend CORS currently allows every origin/method/header and enables credentials. Before exposing a production service, define intended origins, request bounds and operational error handling. There is no authentication, rate limit or database configuration in the source.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `No module named shapely` | Install requirements using the same Python interpreter as Uvicorn/tests |
| Backend imports fail | Use `--app-dir backend`, or run inside `backend` |
| Local frontend contacts Render | Set nonempty `VITE_API_URL` before starting/building Vite |
| Repeated route requests | Fixed using scalar callback dependencies. Actual parameter changes still fetch immediately; development StrictMode may show an initial canceled request followed by a replacement |
| Route calculation fails | A visible alert provides Retry. Telemetry and Analytics stay empty until a successful response; no fallback sample route metrics are displayed. |
| Map tiles or layout fail offline | Tiles, fonts and Leaflet CSS are externally hosted |
| Layer button colors missing | Dynamically composed Tailwind class names may not be emitted |

Do not commit `.venv`, credentials or generated output. The existing ignore file only covers `node_modules/` and repeated `dist/` entries; expanding it is an open maintenance task, not a change made by this documentation update.

## No-route behavior (NAV-02)

HTTP 409 with `detail.code=NO_ROUTE_FOUND` means the API ran but its graph search could not connect the endpoints. Review departure/destination and modeled coverage. Do not treat this as a server outage or automatically relax safety buffers. Other failures continue to use the generic retry message. Successful API responses are unchanged. Deploy backend and frontend changes together so the dashboard can display the specific no-route message.
