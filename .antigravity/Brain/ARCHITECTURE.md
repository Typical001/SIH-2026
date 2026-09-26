> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

## Centered map follow-up — 26 September 2026

This checkpoint supersedes the earlier full-window default and low-zoom repetition notes. The app now opens with planning panels and a bordered rectangular map. Horizontal wrapping/worldCopyJump remain enabled, with no fixed longitude bounds. ResizeObserver sets minimum zoom to ceil(10 × log2(max(viewport width, height) / 256)) / 10, so the viewport never spans multiple complete worlds. World view respects this limit; on wide screens it is an overview, not a guarantee that both poles fit vertically. Fit route restores the selected passage.

SVG route and endpoint copies at longitude offsets -360/0/+360 stay aligned across the date line. Reference/estimated polygon layers and iceberg positions also account for display wrapping; route-corridor filtering normalizes continuous backend longitudes. Renderer teardown belongs to Leaflet, preventing React effect refresh from detaching live SVG paths. The report stacking fix remains active.

Validation: 31 frontend tests across 6 files; desktop default and Hobart–McMurdo route fitting, world-seam pan, all optional layers enabled with visible routes, report open/close, and no alert observed. Backend routing was unchanged. See TESTING.md for the current verification scope.


# Current architecture

## Active architecture — 26 September 2026

React App owns validated inputs and request cancellation. FastAPI main.py calls observed_data.py, observed_routes.py, route_objectives.py and route_geometry.py. The active model is `shared-constraints-objectives-v2`: shared vessel/speed/buffer constraints, Safest lexicographic Dijkstra, Balanced/Fastest A* with zero heuristic. Profile selection is local and does not refetch routes; input changes clear stale results.

PolarMap uses Leaflet/OpenStreetMap tiles and a local coastline fallback. Three route polylines use a dedicated SVG renderer in the route-profiles pane (z-index 450); iceberg observations remain bounded canvas layers. Route clicks do not bubble into coordinate selection. Workspace/map stacking contexts contain Leaflet layers; report-overlay (2000) is above the map toggle (1500). After the requested revert, tiles wrap horizontally, worldCopyJump is enabled, and there are no maxBounds/noWrap restrictions. GoogleEarthMap.jsx is unmounted.

See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for formulas and [TESTING.md](TESTING.md) for evidence.

## Historical architecture below — superseded

## 2026-09-25 demo routing update

[Fix 01](DEMO_FIX_01.md) replaces unchecked transit/fallback routes with whole-passage graph search and segment/terminal/final-output validation. `backend/route_geometry.py` reads bundled global Natural Earth land polygons via pyshp/Shapely STRtree. Available profiles are returned individually; failed calculation or forecast returns an error. Runtime environmental feeds have not yet been replaced by shared demo data. All existing port/station choices remain; offshore approach points await the user's decision.

Reviewed **2026-09-24**, code baseline **8bb44ea**. Source behavior takes precedence over labels and comments.

## Frontend

`main.jsx` mounts `App` in React StrictMode without AuthProvider. App owns departure/destination, fuel, vessel, profile, forecast/buffer, route, overlay and health state. Mounted components are Navbar, ControlDeck, TelemetrySidebar, PolarMap and RouteComparisonModal. The components under `components/panels/`, StatusBar, AuthContext and LoginModal remain in the tree but are disconnected from the active dashboard.

`VITE_API_URL` overrides the API origin; otherwise App uses the page origin, with localhost:8000 as a non-browser fallback. Vite proxies /api to localhost:8000 during development.

A calculation concurrently requests POST calculate-route and GET icebergs. Health and six auxiliary layer/status calls run separately. AbortController/request ownership protects calculation results, but not health/auxiliary requests. Changing the selected route profile also changes fetchRoute and causes another calculation plus auxiliary fetches. There is no periodic data refresh.

Route errors retain previous geometry/metrics. App maps backend metrics into older presentation fields, inserting fixed savings and profile-based risk scores and failing to convert sea-ice fraction to percent. The map receives compact predictions without the initial-position/trajectory fields its trails require. GeoJSON overlays use feature-count keys; the installed React-Leaflet GeoJSON updater changes styles but does not replace data, so equal-count updates retain old geometry/popups.

## Backend request flow

`main.py` exposes 18 application endpoints without auth dependencies or response models. POST calculate-route resolves coordinates and delegates to GET pareto-routes' Python handler. Explicit coordinate overrides take precedence over origin mode; App always sends overrides, bypassing the controller's vessel-fix update branch.

The three-profile handler:
1. Tries the USNIC catalog and falls back to static catalog data.
2. Filters a bounding corridor, truncating to 60 icebergs (or the first 40 if none match).
3. Forecasts a fixed 72 hours with 15 km base buffer. A forecast exception becomes an empty hazard list.
4. Calls ParetoRouteEngine.
5. Returns 409 only for NoRouteFoundError. Other compute exceptions become three identical BALANCED straight-line features with zero distance/time/fuel and FEASIBLE status.

The legacy GET polar-route separately uses PolarPathfinder, supports forecast/buffer inputs and retains a 409 no-route response. It no longer supplies the previous XAI, validated-input or forecast-coverage contracts.

## Geometry and search

Coordinate tuples/waypoints are [latitude, longitude]; GeoJSON coordinates are [longitude, latitude]. Distances use haversine calculations. Shapely polygons use longitude/latitude degrees.

ParetoRouteEngine interpolates an unchecked open-ocean leg to latitude -60 for origins north of that latitude. RiskTensor then builds a degree grid clamped at -75 in the south. Five corridor points preload wind/marine caches; remaining nodes use exact rounded-coordinate cache hits or analytic fields. Three **undirected** NetworkX graphs share node data but have separate profile weights. Direction-dependent current costs are overwritten on reverse edge insertion.

The code blocks sampled nodes using coarse land polygons, final predicted iceberg centers and a simplified RIO formula. Edges and terminal connectors are not collision-checked. Endpoints can be inserted as clear nodes. Guarded A* limits each search to 25,000 iterations/1.2 seconds; these limits do not cover grid construction, providers or total request duration.

Failed searches trigger constraint relaxation/geometric point displacement. No complete final-path validator checks fallback segments or land. The SAFEST expansion uses max(25 km, predicted radius), rather than adding 10 km to every predicted radius. McMurdo lies south of the grid's -75 limit at default resolution.

The legacy engine also uses an undirected graph and node checks. `navigation_geometry.py` retains spherical/segment utilities, but production engines no longer use them. pyproj is imported unconditionally, its transformers are unused, and it is absent from requirements.txt.

## Drift, RIO and fuel

DriftPhysicsEngine integrates weighted wind/current vectors over hourly steps, returns hourly points and snapshots, and buffers the final position. Drift distance is start-to-finish displacement, not traveled trajectory length. Routing is not indexed by vessel arrival time and does not use the full swept trajectory.

RIO is `(1-SIC)*3 + SIC*RIV`, with a single constant per class. PC3 always produces 3; the code's minimum value is -8, so a hard threshold below -10 is unreachable for valid SIC. The visible "Open Water Vessel" string misses the OW lookup and defaults to PC7. This is an unvalidated simplified model, not established POLARIS compliance.

Fuel uses a nominal 35 MT/day at 12 knots multiplied by 0.180 and speed-ratio squared, with SIC/current penalties and extra profile multipliers 1.305/1.107/1.000. Identical geometry therefore burns different fuel by profile name. A 15% reserve is an implementation assumption. ETA and fuel use different ice speed reductions. When SAFEST is UNREACHABLE, BALANCED is recommended without testing its feasibility.

## Providers and persistence

- USNIC: two ArcGIS URLs attempted with timeouts. Parser accepts Point geometry/property coordinates and supplies several dimensions, confidence/date defaults. Cached GeoJSON can be returned alongside a different static routing catalog.
- BYU: CSV parsing or cached/seeded reference points.
- SAR: Copernicus product footprints, without region/date/order filtering, or three seeded polygons. No detection processing.
- Sea ice: fixed regional grid from cached/analytic SIC, advertised as live AMSR2 25 km data.
- Currents/wind: fixed regional sample coordinates plus optional requested point; cached/analytic getters, advertised as live HYCOM/ECMWF.
- Wind/marine live helpers: process-memory caches keyed to coordinates rounded to 0.01 degrees, no TTL/time identity/size cap. First hourly sample is used and response units are not inspected. Empty marine JSON is accepted as zero current/ice.
- Layer SQLite cache: one payload per layer with write time and is_live, no age/coverage validity. A cached true live flag can survive an outage.
- Bathymetry is an external tile URL; layer status says live without checking tile availability.

`data_engine.init_edge_db()` runs at import, creating/seeding gateway, station, vessel, iceberg, ocean and layer tables. The default vessel fix is overwritten with a new timestamp at each initialization. `main.init_sqlite_db()` creates a separate registry schema. `database.py` is a legacy helper with incompatible registry columns and is not imported by production. No schema migration framework reconciles these definitions. The SQLite file is tracked in Git; this audit did not modify it.

## Reports and deployment

PDF generation is client-side and accepts presentation metrics/waypoints, not a complete immutable result/provenance object. Hardcoded certification/SAR/egress checks, vessel name, generic explanation and sampled waypoints can misrepresent a degraded or stale route.

Docker and Render install requirements.txt and start FastAPI. Vercel rewrites all paths to the SPA without an API proxy. Split hosting needs VITE_API_URL at build time; database persistence is not configured. No first-party CI workflow enforces the checks documented in TESTING.

## Official iceberg display optimization (2026-09-24)

The map no longer renders every official iceberg as an animated DOM marker with a popup, trail and circle. `OfficialIcebergLayer.jsx` indexes present/predicted records, uses the active route corridor or current viewport, and renders at most 150 matching records as Leaflet canvas `CircleMarker`s. Near route is the default; Explore area requires zoom level 5 and follows pan/zoom. A selected record alone gets its popup, forecast point, optional buffer and trajectory. The filter only changes visualization; the full catalog remains available to backend routing.

`icebergVisibility.js` validates finite coordinates, computes great-circle route distance and handles dateline viewports. App joins compact predictions with `detailed_forecasts` so selected predictions can use hourly trajectory points. This reduces DOM and animation work; the full provider payload is still downloaded, which is tracked as NAV-50.
