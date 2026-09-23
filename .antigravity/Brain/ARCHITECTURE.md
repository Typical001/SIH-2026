# Architecture

Reviewed **2026-09-19**, baseline **2cc8271** (with PDF Export feature). This describes actual source behavior, including incomplete integration, rather than claims in module docstrings.

## Components and request flow

`frontend/src/main.jsx` mounts App under React StrictMode. App is wrapped with `AuthProvider` (`AuthContext.jsx`) and owns route parameters, scalar request dependencies, AbortController/request ownership, results, explanation, errors, offline metadata, layer flags and the UTC clock. It composes Navbar, LeftControls, MapArea/PolarMap, DecisionSupport, BottomStatusBar, RouteComparisonModal, and LoginModal.

### Authentication & Officer Session (`AuthContext.jsx` & `LoginModal.jsx`)

Client-side authentication context [`AuthContext.jsx`](file:///c:/Users/prath/Downloads/SIH%202026/Project%202026/polar-navigation-dashboard/.antigravity/frontend/src/context/AuthContext.jsx) manages user state (`user`, `isAuthenticated`, `login`, `quickLogin`, `logout`) with `localStorage` persistence.
- **Mandatory Command Auth Gate**: When `isAuthenticated` is false, [`App.jsx`](file:///c:/Users/prath/Downloads/SIH%202026/Project%202026/polar-navigation-dashboard/.antigravity/frontend/src/App.jsx) suppresses route planning requests and renders a full-screen command lock overlay. [`LoginModal.jsx`](file:///c:/Users/prath/Downloads/SIH%202026/Project%202026/polar-navigation-dashboard/.antigravity/frontend/src/components/LoginModal.jsx) runs with `isMandatory={true}` (close button hidden; backdrop click disabled).
- **1-Click Quick Access**: Officers can authenticate using email/password or instant Quick Access chips (Capt. Alex Vance, Dr. Priya Sharma, Cmdr. Henrik Lind).
- **Navbar Profile & Instant Logout**: Interactive user badge in [`Navbar.jsx`](file:///c:/Users/prath/Downloads/SIH%202026/Project%202026/polar-navigation-dashboard/.antigravity/frontend/src/components/Navbar.jsx) showing officer rank, vessel assignment, ice class certification, and a Sign Out button that revokes privileges and locks the UI immediately.

### PDF Report Export (`pdfGenerator.js`)

Client-side utility `frontend/src/utils/pdfGenerator.js` utilizes `jsPDF` and `jspdf-autotable` to dynamically generate an **Official Bridge Navigational Plan PDF** upon user request from `DecisionSupport.jsx` or `RouteComparisonModal.jsx`.
- **Branding**: Official `PolarNav Engine` footer with UTC generation timestamp.
- **Section 1**: Voyage Metadata & Ship Specifications (Vessel name, Ice class, formatted lat/lon departure & arrival coordinates, A* pathfinder route mode).
- **Section 2**: High-Level Voyage Metrics (Total Distance NM, Est Duration Hours/Days, Projected Fuel Burn Tons, Model Risk Score, Max Sea-Ice Concentration).
- **Section 3**: Explainable Risk & Hazard Breakdown (XAI primary routing driver, sea-ice penalty %, hazard cautions, tracked iceberg envelopes).
- **Section 4**: Polar Code Compliance & Contingency Checklist.
- **Section 5**: Waypoint Schedule & Lat/Long Table (Sampled waypoints with lat/lon, leg speed, safety status, notes).

The backend route handler performs:

1. FastAPI query validation and engine coordinate validation.
2. `fetch_environmental_layer(start_lat, start_lon)`: external wind request, current helper and analytic sea ice; save an environmental snapshot if possible. If offline, query SQLite. No cache produces 503 INITIAL_SYNC_REQUIRED. Open-Meteo requests utilize a 60s in-memory rate-limit circuit breaker fallback.
3. `get_initial_icebergs()`, then `DriftPhysicsEngine.get_all_forecasts(...)`.
4. `PolarPathfinder(... resolution=.85 ...)`, graph creation, directed A*, final segment validation, metrics and explanation.
5. Route serialization, planning-envelope radii and origin-preflight source/offline metadata duplicated into route_metrics.

The preflight environmental values are not injected into the drift/router. They call providers again. Unexpected preflight exceptions are converted to offline metadata and execution continues; later provider/DB failures can escape as 500.

## Provider and cache behavior

The default process setting is fast demo mode (`POLARNAV_LIVE_DATA` unset or false). In that mode the preflight, wind, current and iceberg catalog use deterministic analytic/model data directly, avoiding per-coordinate network calls. Live provider requests are opt-in with `POLARNAV_LIVE_DATA=1`; the live path retains the timeout, cache and provenance limitations below.

| Path | Actual data path | Failure behavior |
| --- | --- | --- |
| Wind preflight | Open-Meteo forecast, `models=ecmwf_ifs025`; first hourly speed/direction | SQLite lookup; no record raises ValueError. Missing fields in a 200 response default to 10 km/h and 270 degrees and are marked live. |
| Wind for drift/routing | `fetch_era5_wind_data`; archive only when called directly with date_str, otherwise forecast | SQLite wind; no record raises ValueError. Successful wind getter does not itself save a snapshot. |
| Ocean current | Open-Meteo Marine current velocity/direction | Analytic current helper; cached as normal result |
| Sea ice | Analytic latitude/longitude function | No measured satellite feed |
| Icebergs | Attempted NOAA `natice.noaa.gov/pub/iceberg/icebergs.json`, Point-like coordinate assumptions | Fixed 12-iceberg catalog; no SQLite iceberg read |

Process caches have a 300-second TTL. Wind/current keys round coordinates to 0.1 degrees; wind additionally includes date/latest. Neither includes forecast hour. Wind ignores time_hours; live current uses the current sample, and cached fallback current can also be reused across hours. The first hourly weather entry is chosen without comparing its timestamp to forecast start. The route backtest parameter is never forwarded.

Wind converts km/h to m/s and meteorological direction with negative sin/cos; current uses positive sin/cos. Provider units/schema/direction contracts have not been verified in this review. No network retry/backoff, bulk field download, shared forecast snapshot, total request deadline or concurrency/rate budget is implemented. Drift and graph node sampling can issue thousands of sequential coordinate-specific HTTP requests. A 2.5-second wind timeout/1.5-second current timeout is per call, not per route.

### SQLite

Importing data_engine attempts database initialization beside the source at `backend/polar_nav_offline.db`. database functions accept db_path for direct callers; the application has no environment-based path setting.

- `ocean_environmental_cache`: autoincrement ID, lat/lon, SIC, wind u/v, current u/v, timestamp. Coordinates/vectors are rounded to four decimals on write.
- `iceberg_registry_cache`: iceberg_id primary key, serialized geometry, area and timestamp; INSERT OR REPLACE.

Environmental lookup prefers coordinates matching at one decimal, then the newest row within +/-3 latitude and +/-4 longitude degrees, then the newest row anywhere. It has no maximum age/distance, provenance, observation time or indexed spatial search; the regional match is newest, not nearest. Snapshot time is insertion time. Writes open/commit/close a connection per sample. No retention policy or configured deployment persistent disk exists.

Both live and demo iceberg loops now serialize records with `json.dumps` and attempt SQLite writes. `get_latest_icebergs` remains unused during fallback, and the saved geometry is a Point Feature rather than the advertised registry polygon. Persistence errors are logged at debug level in demo mode.

## Drift model

The hourly integrator combines `0.88 * ocean_vector` with `0.032 * wind_vector` rotated -18 degrees. It uses 111.139 km/latitude degree and longitude scaled by `max(0.1, cos(latitude))`. These are heuristic choices, not a calibrated dynamic/uncertainty model.

At the normal one-hour step, an H-hour forecast has H+1 trajectory records; snapshots include 0, 24, 48 when reached and the terminal hour. Each point carries position, speed, bearing and a radius: base buffer + half iceberg length + a speed/time term. The final buffer polygon has 24 angular samples plus closure. `drift_distance_total_km` is endpoint displacement, not integrated traveled distance. Legacy keys `predicted_position_72h`/`icebergs_predicted_72h` hold the selected horizon.

Coordinates in API routes, drift points and hazard_polygon arrays use latitude then longitude. Shapely geometry uses longitude then latitude. The drift hazard_polygon is not a standard GeoJSON polygon.

## Graph and geometry

`navigation_geometry.py` shares spherical haversine distances, bearings, great-circle interpolation (at most 5 km steps) and minimum point-to-minor-arc distance. The graph bounds surround the endpoints with latitude/longitude margins, clamp to the supported domain and reject more than 50,000 grid nodes. Route input domain is latitude -75..25, longitude -180..180, differing endpoints and longitude span under 180 degrees.

LandMask contains five hand-entered polygons, not complete coastlines. Nodes on land, in forecast circles or in modeled ice for an Open Water Vessel are excluded. Exact endpoints keep actual node conditions and use checked connectors. Edges are tested against spherical hazard circles, sampled domain/SIC and Shapely intersections of the emitted polyline with known land. The selected path is checked again and emitted at <=5 km spacing. Thin known polygon barriers are checked geometrically, while unsampled narrow SIC features can still be missed.

Each forecast hazard is a final-center circle containing all supplied trajectory positions and their radii, plus half the largest consecutive trajectory gap. This is a conservative envelope, potentially causing false no-route results; it does not predict future positions beyond the supplied trajectory or compare hazards with vessel arrival times.

NetworkX DiGraph stores separate directional edge weights: distance times average node cost times a bounded current multiplier (0.85..1.20). Node cost includes sea ice and proximity caution. A* uses 0.85 times spherical distance as an admissible lower bound. It minimizes this graph cost, not fuel consumption directly. Missing/disconnected/blocked paths raise NoRouteFoundError.

## Metrics and explanation

Computed route and great-circle direct baseline share one illustrative segment model:

- Daily burn: `36.5 * (0.2 + 0.8 * (speed / 14.5)^3)` tons/day.
- Segment speed: `speed * (1 - 0.25 * SIC)`; fuel also multiplies by `1 + 0.45 * SIC`.
- SIC is the maximum at each dense segment's endpoints. Modeled current affects search weights but is not used as transit-speed/fuel advection in this calculation.
- Savings: `(baseline_fuel - route_fuel) / baseline_fuel * 100`; negative values are retained.
- Risk: `min(100, max_SIC * 100 + max_node_caution / 2)`, rounded and labeled LOW below 30, MODERATE below 60, otherwise HIGH. It is an uncalibrated exposure index.

Baseline navigability is checked separately; metrics for a blocked baseline are hypothetical. Hazard collision IDs use segment-circle tests, and minimum iceberg distance is to envelope centers, not clearance from their boundaries; it is null with no hazards.

Available coverage is the minimum of the requested horizon and each supplied trajectory's terminal time. The response flags voyage portions beyond that horizon. XAI samples actual path-node factors, including both endpoints, and may exceed ten samples. It is a descriptive heuristic summary, not a learned explanation or causal optimality proof.

## Rendering and deployment boundaries

Leaflet uses EPSG:3857. Route/baseline geometry comes from the API; drift trails use supplied intermediate points. Fixed ice circles are illustrative, and the unpopulated metocean layer is disabled. Risk classes are literal Tailwind values; chart missing samples remain gaps. Several simulation/provider labels have not yet been reconciled with the mixed data path.

Vite proxies relative `/api` calls to localhost:8000 in development. Vercel's current all-path SPA rewrite provides no API proxy; a separate backend requires VITE_API_URL at build time. CORS allows all origins with credentials. Backend endpoints are synchronous, unauthed and have no rate limiter. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for current priorities.
