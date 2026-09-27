# Active architecture

Reconciled 27 September 2026, source `5898e40`.

```text
main.jsx -> CaptainLogin -> authenticated App
              |                |-- Navbar / ControlDeck / TelemetrySidebar
              |                |-- PolarMap -> OfficialIcebergLayer / WrappedGeoJSON
              |                |-- RouteComparisonModal -> lazy pdfGenerator
              +------ auth.js bearer requests ------+
                                                    v
FastAPI main.py + captain_auth.py (one worker)
  observed_data.py -> bundled observations / locations / estimates
  observed_routes.py -> graph / hazards / route validation / results
  route_objectives.py -> directed metrics / Dijkstra / zero-heuristic A*
  route_geometry.py -> Natural Earth land / projected USNIC shelf checks
```

CaptainLogin validates restored sessions before App mounts. App owns planning inputs, results, request cancellation/ownership, reset and report state. authFetch attaches bearer tokens to App, coastline and selected-iceberg requests. Logout/expiry returns to login. Planning localStorage is separate from authentication sessionStorage.

PolarMap owns Leaflet sizing and route/view controls. Routes use an independent SVG pane; official icebergs use static SVG icons, while drift rings/connectors use Canvas. Wrapped geometry remains aligned across the date line. Map/report stacking is isolated and control clicks do not accidentally select origins.

FastAPI globally applies require_captain, exempting health/login only. Swagger/ReDoc/OpenAPI endpoints are disabled. CORS allows all origins for bearer requests; ALLOWED_ORIGINS is parsed but unused. captain_account.json stores a salted verifier; tokens and failed-attempt counters are in memory. One worker is required for session consistency. The ignored credential recovery file is not runtime configuration.

Route requests validate fields, resolve preset IDs to offshore approaches (explicit coordinates take precedence), lock calculation, invoke the observation-backed engine and append an input/dataset/model hash. Caches and required datasets are local. No provider networking or legacy SQLite seeding occurs in active startup.

Map-base GeoJSON is display geometry, not the simplified obstacle input for routing. Selected iceberg envelopes come from the routing geometry. Public-demo waypoint writes remain browser-local; local server saves use locked atomic JSON replacement.

Netlify serves a static build with an explicit Render origin. Vite proxies /api only in development. OSM supplies external tiles. GoogleEarthMap, old AuthContext/LoginModal, old panels and legacy provider/fixture engines are inactive. See [inventory](FILE_INVENTORY.md) and [API](API_REFERENCE.md).
