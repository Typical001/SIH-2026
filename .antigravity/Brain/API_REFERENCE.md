# Active API — 26 September 2026

Base: http://127.0.0.1:8000 . Interactive schema: /docs .

| Endpoint | Purpose |
|---|---|
| GET /api/health | Runtime version, snapshot ID, 33-iceberg count, non-live status |
| GET /api/v1/stations | Five gateways, four stations, offshore approaches |
| POST /api/v1/calculate-route | Validated route profiles, metrics, feasibility, echoed inputs, request hash |
| GET /api/v1/pareto-routes | Query-based route compatibility endpoint; same engine |
| GET /api/v1/polar-route | Query-based compatibility alias; returns route FeatureCollection |
| GET /api/v1/icebergs | Shared observed positions and compact estimated forecast summaries |
| GET /api/v1/icebergs/{id}/trajectory | One estimated trajectory plus exact swept hazard geometry |
| GET /api/v1/icebergs/live | Legacy URL; explicitly returns a dated non-live snapshot |
| GET /api/v1/layers/status | Observation/estimate layer status |
| GET /api/v1/layers/{name} | usnic-icebergs, byu-icebergs, sea-ice, ocean-currents, weather-wind, sar-candidates |
| GET /api/v1/metocean | Calculated environmental layer |
| GET /api/v1/map-base | Local land and shelf display GeoJSON |
| GET /api/v1/vessel/last-fix | Saved user waypoint or labelled assumed waypoint |
| POST /api/v1/vessel/update-fix | Explicit waypoint save; lat/lon and optional vessel_imo |

Main route request defaults: forecast_hours 72, safety_buffer_km 25, origin_type GATEWAY, gateway_code ZACPT, destination_station_id bharati_station, vessel_ice_class PC3, cruising_speed_knots 14.5, remaining_fuel_mt 450, max_tank_capacity_mt 500, reference_burn_mt_day 12, reserve_percent 15.

Horizon range 0–168 h; buffer 5–100 km; fuel 0–5000 t and no greater than tank capacity. Non-finite and out-of-range coordinates are rejected. MID_OCEAN_COORDINATES and CURRENT_SHIP_GPS accept origin_coords [lat, lon]; optional start/end latitude+longitude pairs override endpoints. The GPS token is retained for compatibility and does not imply a live AIS service.

grid_resolution_deg is retained as a compatibility parameter; the active finite passage network is fixed and there is no enabled UI grid-resolution control.

Routing model: `shared-constraints-objectives-v2`. All profiles share speed and safety buffer. Safest minimizes cumulative estimated ice-exposure hours (time breaks ties); Fastest minimizes time; Balanced minimizes time + 4 × exposure. Feature properties include `objective`, `objective_value`, `ice_exposure_hours`, `commanded_speed_knots` and `shared_corridor_with`. Metadata includes `routing_model`, `profile_overlap`, `overlap_tolerance_km` (10), and `shared_corridor_threshold_percent` (90). Request hashes now include the dataset and routing model as well as inputs.

HTTP 200 contains only geometry-validated profiles. Fuel-infeasible profiles are labelled UNREACHABLE and never recommended. Unavailable geometry profiles are omitted and listed in metadata. HTTP 409 means no route in the current network/model, 422 invalid input, 503 required data unavailable. Errors never carry successful route geometry.

All backend observation/routing data comes from local source files. The frontend separately downloads OpenStreetMap tiles. Recent SVG rendering, report stacking and reverted bounds do not change API contracts, coordinate order or returned route geometry. Panning is a display action; Map Click mode explicitly selects a new origin. See CURRENT_IMPLEMENTATION.md for units, provenance and estimation formulas.
