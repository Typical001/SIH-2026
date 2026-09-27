# Development guide

Reconciled 27 September 2026, source 5898e40. Git root is polar-navigation-dashboard; application root is .antigravity. Use [RUNNING.md](RUNNING.md), [ARCHITECTURE.md](ARCHITECTURE.md), [TESTING.md](TESTING.md) and [DEPLOYMENT.md](DEPLOYMENT.md).

Frontend entry: main.jsx -> CaptainLogin -> App. auth.js centralizes bearer calls. PolarMap/OfficialIcebergLayer handle routes and detail; ControlDeck renders controls while App owns state/requests; RouteComparisonModal/pdfGenerator present results.

Backend entry: main.py and captain_auth.py. observed_data.py loads sources/estimates; observed_routes.py handles graph/hazards/results; route_objectives.py searches/measures; route_geometry.py validates geometry. Do not reconnect legacy provider or simulated-fixture imports accidentally.

| Setting | Actual effect |
|---|---|
| VITE_API_URL | Build-time API origin; normally unset locally for Vite proxy |
| VITE_PUBLIC_DEMO | Browser-local waypoints, deployed route/map deadlines 180s versus local 30s/15s |
| PUBLIC_DEMO | Backend rejects shared waypoint writes and ignores saved server fixes |
| ROUTE_CACHE_SIZE | Cache capacity clamped 1–36; deployed 4 |
| ALLOWED_ORIGINS | Parsed but unused by wildcard CORS middleware |
| captain_account.json | Backend password verifier; no credential environment override |

Vite proxies /api to localhost:8000 in development only. npm dev binds broadly by default; documented startup explicitly binds loopback. There is no active live-data gate, backtest endpoint, source-date selector or live AIS connection.

Setup installs requirements-dev.txt (requirements.txt plus httpx). Render uses smaller pinned requirements-deploy.txt. Node 22 is the deployment target; use the lockfile. Old tests/dependencies are not evidence their legacy features are connected.

Preserve source hashes and provenance when adding snapshots. Do not label assumptions as measurements. Local waypoint JSON is separate from observations; public waypoints stay in the browser. Do not commit tokens, local env files or credential screenshots.

Maintain coordinate order/unwrapped longitude handling, authoritative backend geometry, map minimum zoom/wrapping, SVG route lifecycle, report layering and lazy detail. Protect new APIs and use authFetch in connected components. See KNOWN_ISSUES before changing worker count or using the outdated Dockerfile.
