# Public deployment — Netlify and Render Free

Application deployment 5898e40 verified 27 September 2026. Both services follow Typical001/SIH-2026 on main. This documentation reconciliation is a working-tree change, not a new deployment.

- Frontend: https://polarnav-sih2026.netlify.app/
- Backend: https://polarnav-backend.onrender.com/
- Render service: srv-das14igjo6nc739q2bj0, Free, Singapore.

## Render configuration

Root .antigravity (backend and research siblings are both required). Source configuration: render.yaml.

- Build: `pip install -r backend/requirements-deploy.txt`.
- Start: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1 --limit-concurrency 32`.
- Python 3.13.5; public health endpoint /api/health.
- PUBLIC_DEMO=true rejects shared waypoint writes and ignores server saves.
- ROUTE_CACHE_SIZE=4 bounds retained route graphs; calculations serialize.
- ALLOWED_ORIGINS remains configured/parsed but middleware actually uses wildcard origins. Changing that variable currently does not restrict origins.

CORS permits GET/POST bearer requests. All application APIs except health/login require captain sessions. Sessions are in memory; keep one worker. Restarts/spin-down discard sessions/caches. No paid compute or persistent disk is configured.

Required files: backend/data/{observed_icebergs.json,locations.json,map_base.geojson,ne_10m_land.zip}, research/iceberg-data/{byu_snapshot.geojson,usnic_shelf_2022.zip}, and the captain verifier. Historical CSV tracks, legacy SQLite, live providers and Google key are not required.

## Netlify configuration

Repository-root netlify.toml sets base .antigravity/frontend, publish dist, Node 22, SPA fallback, security headers and VITE_PUBLIC_DEMO=true. Build: `node scripts/check-deployment.mjs && npm run build`.

VITE_API_URL=https://polarnav-backend.onrender.com (no trailing slash or /api). This is public config; rebuild after changing it. Static production does not include Vite's local API proxy. Credentials must never be VITE variables.

The site is publicly reachable, but dashboard access requires captain login. Waypoints remain browser-local. OSM supplies external raster tiles.

## Evidence and limits

Live login, three default profiles, 33 observations, logout and anonymous 401 responses were verified after the captain deployment. Earlier deployment checks covered PC5/McMurdo rejection and public waypoint-write rejection. See [TESTING.md](TESTING.md).

Free Render may take minutes to start. Login and deployed route/coastline requests allow up to 180 seconds. Startup warms graphs before health becomes ready. Availability/concurrency remain limited; free instance hours are shared in the workspace. Earlier Windows ~125 MiB peak working-set measurement is not a Linux/load guarantee.

The old Dockerfile is unsupported for this deployment: Python 3.10 base and backend-only copy omit required sibling research. Vercel is not the active host.

## Git and private files

The captain verifier is committed; plaintext credentials are not. .env.captain, .env.local, .run, node_modules and dist are ignored. Keep these private/generated files out of commits. See [CAPTAIN_ACCESS.md](CAPTAIN_ACCESS.md).

A Google key was previously tracked, then removed from the current tree. Historical exposure is not revoked by deleting the file. Provider restriction/rotation has not been verified.
