# Public deployment: Netlify + Render

Prepared 27 September 2026. Free plans only. Deployment URLs and cloud verification are recorded after publishing.

## Render backend

Repository: Typical001/SIH-2026, branch main. Runtime Python, root directory `.antigravity` (not `backend`, because research files are siblings).

- Build: `pip install -r backend/requirements-deploy.txt`
- Start: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --limit-concurrency 32`
- Health check: `/api/health`
- Python: `3.13.5`
- `PUBLIC_DEMO=true`: disables shared waypoint writes and ignores any shared saved fix.
- `ROUTE_CACHE_SIZE=4`: bounds retained graph variants. Route calculations are serialized to limit transient memory.
- `ALLOWED_ORIGINS`: exact Netlify HTTPS origin, no trailing slash. Comma-separated additional origins may be configured explicitly.

Blueprint configuration: `.antigravity/render.yaml` relative to repository root. Do not select paid compute or disks.
Bundled inputs: backend/data/{observed_icebergs.json,locations.json,map_base.geojson,ne_10m_land.zip} and research/iceberg-data/{byu_snapshot.geojson,usnic_shelf_2022.zip}.
The active API does not require the historical CSV archive, SciPy legacy code, AIS database or Google key. Shapely installs NumPy as a dependency.

## Netlify frontend

Repository-root `netlify.toml` configures base `.antigravity/frontend`, publish `dist`, Node 22, SPA fallback and `VITE_PUBLIC_DEMO=true`.
Set `VITE_API_URL=https://ACTUAL-BACKEND.onrender.com` before building. No `/api` suffix or trailing slash. This value is public, not a secret.
Build validates that this value is supplied, then runs `npm run build`. Rebuild after changing Vite environment variables.
Public demo waypoints remain in the browser's existing local storage. The saved-waypoint action selects those coordinates rather than fetching another visitor's fix.

## Limits and verification

Free Render sleeps after inactivity; initial route and coastline requests allow up to 180 seconds. There is no guarantee of availability or fast concurrent requests. Free instance hours are shared with other services in the workspace.
Windows single-route measurement: ~125 MiB peak working set; this is not a Linux or load-test guarantee. Check cloud memory/logs after publishing.
Check health, all 33 iceberg records, CORS preflight, default three routes, PC5 McMurdo rejection, fuel feasibility, report export and browser console after deployment.
Keep local `.env.local` files out of Git. A previously tracked key remains in Git history; removing it from the current tree does not revoke it. Restrict or rotate it at its provider if exposed.

Local verification: 18 backend tests and 32 frontend tests passed; Vite production build passed. Cloud checks pending.

## Created services

- Frontend: https://polarnav-sih2026.netlify.app (public; Netlify GitHub deployment).
- API: https://polarnav-backend.onrender.com (Render Free, Singapore).
- Render service: srv-das14igjo6nc739q2bj0.
- Source deployment commit: a4bdfe3.
- Both services follow the existing main branch. Netlify previews remain private.
- Netlify VITE_API_URL points to the API origin. Render ALLOWED_ORIGINS is set to the exact frontend origin.
