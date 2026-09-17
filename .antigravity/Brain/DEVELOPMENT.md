# Development and deployment

Reviewed 2026-09-17 at `dccfa3b`. Setup is still applicable, but request/no-route/error handling has regressed and restored tests are not currently runnable as a complete suite. See [TESTING.md](TESTING.md).

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

The unused application-root `package-lock.json` was deleted in c996de7; frontend/package-lock.json remains the actual lockfile. Run npm from `frontend`. A fresh npm ci will not install the removed Vitest/React Test Renderer packages, and the test script must be restored before npm test can run. The project also includes a portable `nodejs/node.exe`; `setup_node.py` downloads Node 20.18.0 and replaces that directory. Inspect the script before using it because it recursively removes an existing `nodejs` directory. It is not required when Node is already installed.

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
| Repeated route requests | NAV-01 regressed: unstable currentCoords callback dependency plus App clock/state rerenders; restore scalar dependencies and request guards |
| Route calculation fails | Navbar claims local fallback, but there is no local route engine. Old results can persist and DecisionSupport shows fixture metrics; NAV-06 is open |
| npm test reports missing script | package.json test script and test dependencies were removed; restoring App.test.jsx alone is insufficient |
| NoRouteFoundError import fails | Test file was restored, but engine exception/API handler were not; NAV-02/24 are open |
| Forecast duration appears wrong | Selector sends hours; 24 Days and 7 Days labels are incorrect for 24 and 72 |
| Map tiles or layout fail offline | Tiles, fonts and Leaflet CSS are externally hosted |
| Layer button colors missing | Dynamically composed Tailwind class names may not be emitted |

Do not commit `.venv`, credentials or generated output. The existing ignore file only covers `node_modules/` and repeated `dist/` entries; expanding it is an open maintenance task, not a change made by this documentation update.

## Current API and UI compatibility

The route endpoint now includes `xai_explanation`. Updated frontend and backend should be deployed together; an older backend leaves the explanation unavailable. The standalone response.json sample lacks this field and is not consumed by the app.

The previous HTTP 409 / NO_ROUTE_FOUND behavior is absent. Failed graph search can now return HTTP 200 with a fabricated 25-point route; this remains an unresolved regression. Backend exceptions such as zero-distance division can still produce 500. Do not interpret an HTTP 200 result or LOW label as a route safety check.

The two calculation buttons both fetch the complete route. Manual coordinates and buffer sliders no longer render. The frontend's metocean checkbox has no fetch behind it. These are implementation facts, not environment setup failures.

## Local verification commands

From the application root, with the existing configured interpreter:

```powershell
.\backend\venv\Scripts\python.exe -B backend\test_backend.py
.\backend\venv\Scripts\python.exe -B backend\test_no_route.py
```

The first currently passes; the second fails at import. From frontend, `npm.cmd run build` passes with the existing toolchain and `npm.cmd test` fails because no test script exists. Do not report a green regression suite until the script/dependencies, panel mocks and application behavior are repaired. Existing installed tools may outlive their removal from manifests; use a fresh install for a later reproducibility check.

Main-only team collaboration and documentation maintenance are described in [CONTRIBUTING.md](CONTRIBUTING.md). This review made no deployment, dependency or application-code changes.
