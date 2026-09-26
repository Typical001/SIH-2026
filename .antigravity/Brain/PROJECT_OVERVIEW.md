> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

# Project overview

## Current product — 26 September 2026

A local Antarctic passage-planning demonstration using 33 dated USNIC iceberg observations, earlier BYU reference positions, Natural Earth land and USNIC shelf geometry. Missing drift, environment and vessel performance are explicitly calculated estimates. All five gateways and four stations remain available through offshore approach legs.

Safest minimizes cumulative estimated ice exposure, Fastest minimizes ETA, and Balanced trades ETA against exposure. Every profile uses the same requested vessel, speed and buffer. Shared corridors are labelled rather than artificially separated. The flat Leaflet/OpenStreetMap map supports world exploration, route fitting, canvas iceberg observations, SVG routes and a planning report displayed above the map. World wrapping is currently restored at the user's request; repeated continents at low zoom remain a known display limitation. The saved Google key is not used by this active map.

Current evidence: 16 backend tests at the routing checkpoint; 27 frontend tests at the latest revert checkpoint. Details and limitations are in [TESTING.md](TESTING.md).

## Historical product descriptions below — superseded

## Demo scope agreed 2026-09-25

Retain all five gateways and four Antarctic stations. Build repeatable simulated scenarios with consistent visible obstacles and calculated route behavior. Live-data reliability is no longer the product goal. [Fix 01](DEMO_FIX_01.md) implements route guards; offshore approach points and shared simulation datasets remain pending. Existing live feeds are still present until the next data-conversion step.

Reviewed **2026-09-24**, code baseline **8bb44ea**.

## Purpose and stack

PolarNav demonstrates Southern Ocean voyage planning and iceberg movement forecasting for SIH-26059. React 18/Vite/Tailwind render the interface; Leaflet renders the map; FastAPI provides data and route calculations; NumPy, NetworkX and Shapely support the models. jsPDF and jspdf-autotable generate a browser download. No trained machine-learning model is loaded by the application.

## Active workflow

1. Select a gateway, retrieve the stored vessel fix, or enter/click an ocean coordinate.
2. Choose Bharati, Maitri, McMurdo or Rothera; choose vessel class and speed.
3. Adjust remaining fuel and request recalculation. The frontend sends `POST /api/v1/calculate-route`.
4. Compare SAFEST, BALANCED and FASTEST profiles, their geometry, estimated time and bunker status.
5. Inspect iceberg predictions, reference icebergs, SAR acquisition footprints, sea ice, currents, wind and bathymetry overlays.
6. Open the voyage report or download a PDF through the Navbar, telemetry sidebar or comparison modal.

The five gateway presets are Cape Town, Ushuaia, Punta Arenas, Hobart and Christchurch/Lyttelton. Presets are duplicated in the frontend and backend. The dashboard defaults to Cape Town–Bharati, Balanced, 200 MT remaining fuel and 200 MT capacity; the POST API itself defaults to PC5 and 450/500 MT. See API_REFERENCE for endpoint-specific defaults.

Controls offer speed 8–22 knots, forecast 24–168 hours in 12-hour steps, and safety buffer 10–50 km. **The forecast and buffer controls currently affect the separately fetched iceberg overlay only:** three-profile routing remains fixed at 72 hours and a 15 km base buffer.

## Connected and disconnected features

| Feature | Current implementation |
| --- | --- |
| Three route profiles | Active; three weighted searches, not a verified nondominated Pareto frontier |
| Gateway/manual/map origin | Active; manual coordinates lack geographic validation |
| Current ship GPS | Reads SQLite/seeded coordinates; no live AIS receiver or provider |
| Iceberg forecast | Weighted wind/current dead reckoning; hourly trajectory available in detailed response |
| Live feeds | External requests are attempted; cached and analytic fallbacks are mixed and mislabeled |
| Risk heatmap | Hazard circles; the RIO grid is not sent/rendered as a heatmap |
| SAR candidates | Imagery acquisition footprints or seeded boxes; no radar-image iceberg detector |
| PDF report | Active browser generator; embeds unsupported safety/compliance statements |
| Authentication | AuthContext and LoginModal files remain but are not mounted; no auth API endpoints |
| Explainable routing | Old panel code remains; current route response lacks the documented XAI contract |
| Historical/backtest routing | No current backtest endpoint/parameter implementation |
| Automatic monitoring | Clock updates, but no timed route/feed refresh loop |

## Current limitations

Routing uses coarse geographic-degree grids, five hand-entered land polygons, node-only hazard checks and unchecked terminal/open-ocean/fallback segments. EPSG:3031 transformers are created but unused; the map remains EPSG:3857. The default 0.8-degree grid does not reach McMurdo's latitude and falls back geometrically.

Risk, fuel and status labels contain hardcoded assumptions. A failure may leave an old route visible under new settings or return a fabricated route with zero metrics. The exported report cannot establish vessel certification, emergency egress or SAR availability. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md) for specific fixes and [TESTING.md](TESTING.md) for verified failures.

## Official iceberg display behavior

The dashboard keeps the full official catalog for routing but displays only nearby items. Near route mode shows present or forecast positions within a selected 25/50/100 km route corridor and the current viewport. Explore area requires zoom level 5 or closer and follows panning. Dots use a shared canvas renderer, at most 150 visible records, and show details/buffers/trails only for the selected dot. This is a visualization filter and does not remove hazards from route computation.
