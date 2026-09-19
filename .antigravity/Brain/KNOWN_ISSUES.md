# Known issues and proposed work

Reviewed **2026-09-19**, current **2cc8271** (with PDF Export feature). Priorities describe engineering work on this prototype. Fixed means the stated implementation defect is repaired, not that navigation is certified.

## Highest-priority integration work

| ID / priority | Finding and evidence | Completion criteria |
| --- | --- | --- |
| NAV-28 / Medium / Partial | `json` import and demo/live iceberg writes are now present. SQLite iceberg retrieval is still unused for fallback, geometry is Point-like rather than a registry polygon, and persistence/readback has no end-to-end contract. | Persist validated records, read the catalog on outage/restart, and test live/demo serialization and failures. |
| NAV-29 / High / Open | database.get_latest_ocean_snapshot falls back to newest regional, then newest global row, without expiry. Probe: request (-69,76) received a row at (20,70). Timestamp is write time; source/observation time are absent. | Require documented spatial/time validity and preserve source/observation timestamps; return unavailable beyond coverage. Test distant/stale/regional cases. |
| NAV-30 / High / Open | Every cold route-grid coordinate may request wind/current sequentially. Drift also samples moving coordinates. Per-call timeouts and a 300-second cache do not bound total route work; graph cap is 50,000 nodes and metocean cap 10,000 points. Source-confirmed; no live load test run. | Fetch bounded fields/snapshots and reuse them, with a total deadline/request budget and provider rate handling. Assert call-count/latency bounds with fixtures. |
| NAV-31 / High / Open | backtest_date is accepted but never forwarded; get_wind_vector ignores time_hours and chooses the first hourly value. Current data/cache also lacks forecast-hour identity. Archive helper can silently fall through to current forecast. | Validate and propagate date/time, select timestamp-aligned samples, prohibit silent historical-to-current substitution, and test distinct horizons/dates. |
| NAV-32 / High / Open | Route source/offline metadata comes only from origin preflight; routing refetches independently. Preflight may include modeled current/SIC and calls no iceberg provider yet says Live ECMWF / USNIC Feed. Probe: empty 200 JSON becomes default wind marked live and is saved. | Reject malformed weather, record provenance/freshness per input and aggregate actual route usage; separate observed, cached and simulated components. |
| NAV-33 / High / Partial | Default demo mode avoids cold-cache provider failures. Live mode still has inconsistent `/icebergs` and `/metocean` outage responses; later route failures can become 500 and unexpected preflight errors are swallowed. | Shared typed provider/cache errors and consistent structured responses for live mode, with downstream outage/persistence tests and OpenAPI descriptions. |
| NAV-34 / Medium / Open | API base now defaults to same origin; current Vercel all-path SPA rewrite has no API proxy. Split deployment without VITE_API_URL will target frontend /api and may receive HTML. Configuration finding, not a hosted probe. | Set and document build-time backend URL or real proxy; test deployed API requests. Define persistent SQLite storage/path configuration. |
| NAV-35 / Medium / Open | App resets route results but not isOffline/lastSynced at request start/failure, so Navbar can show previous-request metadata. Every HTTP 503 is labeled initial sync without checking code. | Reset or explicitly scope provenance to prior results; distinguish INITIAL_SYNC_REQUIRED from generic service failure; component tests for both. |
| NAV-36 / High / Open | NOAA parser assumes flat Point coordinates, accepts missing coordinates as zero, defaults dimensions/confidence, and leaves the fixed September 2 timestamp. Nested/invalid provider data can escape ingestion and fail later. Live contract unverified. | Validate actual provider schema/geometry, geographic scope, finite values, units and observation times; test malformed/empty/changed shapes and avoid silently inventing observations. |

Address provider workload, persistence/coverage, time/provenance and error contracts together before claiming dependable live/offline operation.

## Existing NAV register: current status

The earlier IDs are retained so previous discussions remain traceable. Historical descriptions are in Git and CHANGELOG; this table supersedes old open/fixed counts.

| ID | Current status and remaining work |
| --- | --- |
| NAV-01 | **Fixed in 6d1f221.** Scalar dependencies, abort/ownership guards and cleanup prevent clock/layer/result-driven refetch loops. |
| NAV-02 | **Fixed in 6d1f221, strengthened dedbb48.** NoRouteFoundError / 409 without fabricated route/metrics/XAI. Controlled engine/ASGI tests pass. |
| NAV-03 | **Partial / High.** Complete segment/connector checks against supplied geometry/envelopes work. Five hand-entered polygons omit coastline detail. |
| NAV-04 | **Partial / High.** Forced-positive savings and LOW cap removed; signed savings and exposure risk remain uncalibrated. |
| NAV-05 | **Regressed in data labeling / High.** Health/source/offline labels overstate provider validity while UI/backend still call all inputs synthetic. |
| NAV-06 | **Fixed core behavior.** Results/XAI clear on calculation/failure; loading/empty/Retry work. |
| NAV-07 | **UI issue fixed; feature deferred.** Metocean control disabled/labeled and ice circles marked illustrative. |
| NAV-08 | **Fixed dedbb48.** 24/48/72-hour labels and map/chart use selected hours. |
| NAV-09 | **Fixed dedbb48.** Popups and controls use current endpoint names/coordinates. |
| NAV-10 | **Fixed dedbb48.** Invented comparison/weather values removed; zeros preserved, missing values unavailable, duration rollover/chart gaps corrected. |
| NAV-11 | **Fixed bounded-input scope dedbb48.** Geographic/class/query/grid bounds enforced. Provider fanout still unbounded, NAV-30. |
| NAV-12 | **Fixed dedbb48.** Directed current costs and admissible .85-distance heuristic; controlled Dijkstra comparison passes. |
| NAV-13 | **Partial / High.** Trajectory envelope avoided and forecast gaps exposed. Arrival-time routing remains missing. |
| NAV-14 | **Fixed dedbb48.** Baseline display/distance/collisions share spherical geometry. |
| NAV-15 | **Fixed dedbb48.** Literal Tailwind risk/checkbox classes replace dynamic construction; visible UI tests pass. |
| NAV-16 | **Projection label fixed; capability deferred.** Map correctly labels EPSG:3857. |
| NAV-17 | **Partial / Medium.** Test dependencies locked, query bounds and parent ignore rules added. |
| NAV-18 | **Fixed dedbb48.** Identical endpoints reject with 422 rather than dividing by zero. |
| NAV-19 | **Partial / High.** Open Water Vessel rejects sampled SIC >0. Polar Class cost weights are not certified operating limits. |
| NAV-20 | **Partial / Medium.** Speed-dependent cubic fuel model replaces fixed daily burn. |
| NAV-21 | **Retired by UI removal.** Former manual-coordinate clearing bug no longer reachable. |
| NAV-22 | **Fixed dedbb48.** Markers, buffers and drift trails toggle independently. |
| NAV-23 | **Fixed dedbb48.** Trails render supplied intermediate trajectory points. |
| NAV-24 | **Fixed.** Explicit base URL `'http://localhost'` added to `App.test.jsx:73`. All 36 Vitest cases pass cleanly (100%). |
| NAV-25 | **Partial / Medium.** XAI uses actual graph-node factors/endpoints and maximum caution. |
| NAV-26 | **Partial / Medium.** Endpoint labels corrected. Manual coordinates and buffer inputs absent. |
| NAV-27 | **Fixed & Extended.** Added Official Bridge Navigational Report PDF export feature (`pdfGenerator.js`) powered by **PolarNav Engine**. All 37 Vitest UI tests pass. |

## Evidence and delivery order

See [TESTING.md](TESTING.md): 37/37 frontend tests pass; build passes; 24 unittest plus 3 pipeline checks pass with controlled providers.

1. Stabilize provider adapters, bounded snapshot acquisition, persistence, spatial/time validity and explicit provenance/error handling (NAV-28–33/36).
2. Repair same-origin deployment wiring and offline UI state (NAV-34/35).
3. Complete geographical/vessel and forecast-time modeling; calibrate fuel/risk/XAI evidence (NAV-03/04/13/19/20/25).
