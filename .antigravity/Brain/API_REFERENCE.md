# API reference

Verified from source **2026-09-19**, **2cc8271** (with PDF Export feature). Local base `http://localhost:8000`. All five application endpoints are GET/JSON; FastAPI also provides `/docs`, `/redoc`, `/openapi.json`. There is no authentication or explicit response-model validation.

## Endpoints

| Path | Response / behavior |
| --- | --- |
| `/api/health` | Fixed service/version/engine/feed strings, cors_enabled and timestamp_utc; no active health checks |
| `/api/v1/stations` | status=success and six-entry stations dictionary |
| `/api/v1/icebergs` | status, forecast_hours, total_icebergs, icebergs_present, icebergs_predicted_72h, detailed_forecasts |
| `/api/v1/metocean` | status=success and grid with bounds, points, total_points |
| `/api/v1/polar-route` | Computed/baseline geometry, iceberg data, metrics, endpoints, explanation, origin-preflight offline metadata, and PDF report data payload |

Health timestamp is hardcoded to `2026-09-18T12:00:00Z`; feed labels do not prove provider reachability or data freshness. Station metadata includes McMurdo at -77.8419 latitude, outside the route domain.

## Route query

| Parameter | Type | Default | Enforced bounds / behavior |
| --- | --- | --- | --- |
| start_lat | float | -33.9249 | -75..25 |
| start_lon | float | 18.4241 | -180..180 |
| end_lat | float | -69.4125 | -75..25 |
| end_lon | float | 76.1872 | -180..180 |
| forecast_hours | integer | 72 | 0..168 |
| vessel_ice_class | enum string | Polar Class 3 (PC3) | Exact names below |
| safety_buffer_km | float | 25 | 5..100 |
| cruising_speed_knots | float | 14.5 | 5..30 |
| backtest_date | optional string | null | Accepted but unused; no date-format validation or historical-route behavior |
| data_mode | enum string | offline | `offline` uses fast analytic demo data; `online` enables provider requests for this route |

Class values: `Polar Class 1 (PC1)`, `Polar Class 3 (PC3)`, `Polar Class 7 (PC7)`, `Open Water Vessel`.

Coordinates must be finite; endpoints must differ by at least 1e-6 nautical miles. Absolute longitude span must be below 180 degrees; date-line-spanning requests are unsupported. The API uses a .85-degree graph; graph creation rejects more than 50,000 nodes. Open-water vessels reject sampled modeled ice; the other classes have cost weights, not certified operating limits.

## Other queries

`/api/v1/icebergs` accepts forecast_hours and safety_buffer_km with the route defaults/bounds. Health and stations have no parameters.

| Metocean parameter | Default | Constraint |
| --- | --- | --- |
| min_lat / max_lat | -72 / -32 | -90..90, minimum <= maximum |
| min_lon / max_lon | 10 / 85 | -180..180, minimum <= maximum |
| lat_step / lon_step | 3 / 4 | .25..20 degrees |

The metocean API rejects estimated grids over 10,000 samples. These bounds do not ensure acceptable latency: each cold coordinate can trigger external requests.

## Successful route response

Top-level fields: `waypoints`, `direct_baseline_waypoints`, `icebergs_present`, `icebergs_predicted_72h`, `route_metrics`, `origin`, `destination`, `vessel_ice_class`, `forecast_hours`, `xai_explanation`, `data_source`, `is_offline`, `last_synced_timestamp`.

Waypoints are `[latitude, longitude]`, exact endpoints retained, spherical interpolation at <=5 km steps. Endpoint objects are `{lat, lon}`. Internal engine status/algorithm/hazard_zones are not returned by this endpoint.

Initial iceberg fields: id, name, lat, lon, length_km, width_km, thickness_m, mass_mt, ice_class, source, confidence, last_updated_utc, metadata. Source/confidence/default timestamp are not validated provider observations; the default iceberg timestamp remains `2026-09-02T12:00:00Z` even for parsed live entries.

Predicted route iceberg fields: id, name, lat, lon, initial_lat, initial_lon, planning_hazard_radius_km, safety_radius_km, safety_radius_nm, drift_distance_total_km, hazard_polygon, trajectory_points, snapshots. Planning radius encloses the supplied trajectory and is rounded upward to .001 km; final safety radius is a separate quantity. `hazard_polygon` uses `[lat, lon]` arrays and represents the final-time buffer, not the larger planning envelope.

Each trajectory point has step, time_hours, lat, lon, speed_knots, bearing_deg, safety_radius_km. Snapshots include `0h`, `24h`, `48h` when reached and the terminal horizon. Legacy `72h` names represent the requested horizon, not always 72 hours. `drift_distance_total_km` is endpoint displacement.

The standalone iceberg endpoint's compact predictions omit initial coordinates, nautical radius, planning radius and trajectory_points; `detailed_forecasts` separately contains full engine records.

### Client-Side PDF Report Generation Data Flow

The `/api/v1/polar-route` response payload is directly bound by `pdfGenerator.js` to render official 5-section bridge execution reports:
- Waypoints $\rightarrow$ Section 5 Waypoint Schedule table (formatted to `DD°MM' S/N, DD°MM' E/W`).
- `route_metrics` $\rightarrow$ Section 2 High-Level Voyage Metrics & Section 3 Sea-Ice Hazard Index.
- `xai_explanation` $\rightarrow$ Section 3 Primary Routing Driver & Hazard Cost Modifiers.
- `icebergs_predicted_72h` $\rightarrow$ Section 3 Tracked Iceberg Proximity Alerts.
- `vessel_ice_class` & endpoints $\rightarrow$ Section 1 Voyage Metadata & Ship Specifications.
- Footer $\rightarrow$ `Generated automatically by PolarNav Engine | Timestamp: [UTC Timestamp]`.

### Route metrics

| Fields | Meaning |
| --- | --- |
| distance_nautical_miles / distance_km | Summed computed spherical route distance |
| direct_distance_nm | Summed great-circle baseline distance |
| estimated_voyage_hours / estimated_voyage_days | Modeled route transit time |
| fuel_consumption_tons | Illustrative route fuel consumption |
| direct_fuel_consumption_tons / direct_estimated_voyage_hours | Baseline using the same segment model |
| fuel_savings_percent | Signed baseline comparison; negative values allowed |
| baseline_is_navigable | Baseline passes existing modeled segment checks; not real-world certification |
| iceberg_hazard_buffer_km | Requested base buffer, excluding other enlargement terms |
| min_iceberg_distance_km | Minimum route-segment distance to forecast envelope centers; null if no hazards |
| forecast_hazards_considered | Number of planning envelopes, not encounters avoided |
| direct_route_collision_hazards | IDs of envelopes intersected by baseline segments |
| max_sea_ice_concentration_pct | Maximum sampled route SIC times 100 |
| risk_score / risk_rating | Uncalibrated 0..100 index; LOW <30, MODERATE <60, HIGH otherwise |
| requested_forecast_hours / forecast_hours | Requested vs available trajectory coverage |
| forecast_covers_voyage / uncovered_voyage_hours | Coverage flag and positive gap in hours |
| hazard_mode / warnings / fuel_model / risk_model | Model descriptions and limitations |
| data_source / is_offline / last_synced_timestamp | Copy of origin preflight metadata; not aggregate route provenance |

The old `icebergs_avoided_count` and `latency_compensation_status` fields are removed. A blocked direct baseline's time/fuel are hypothetical. See [ARCHITECTURE.md](ARCHITECTURE.md) for model formulas.

### Explanation

`xai_explanation` contains primary_routing_driver, route_modifiers (`max_sea_ice_penalty_pct`, `iceberg_proximity_caution`) and waypoint_explanations. Each sampled node includes lat/lon and decision_factors: sic_value (fraction), ice_penalty_applied (multiplier), ocean_current_spd_kts, wind_spd_kts, base_cost_weight. Both endpoints use actual node factors; samples may exceed ten. The fixed driver description and factors summarize heuristic costs.

### Metocean grid

Point fields are lat, lon, wind_u, wind_v, wind_spd_kts, ocean_u, ocean_v, ocean_spd_kts, sic. Vector components are m/s, positive east/north; SIC is a fraction. Point payloads do not expose source, timestamps or offline flags. The UI does not currently request this endpoint.

## Errors

| HTTP | Condition | Payload |
| --- | --- | --- |
| 422 | FastAPI query type/range/enum validation | Standard detail list |
| 422 | Unsupported route domain, equal endpoints, longitude span, graph size | detail.code=INVALID_ROUTE_INPUT with message |
| 422 | Reversed metocean bounds / oversized grid | detail.code=INVALID_BOUNDS / GRID_TOO_LARGE |
| 409 | No graph path, blocked/missing endpoint or failed final segment check | detail.code=NO_ROUTE_FOUND |
| 503 | Live-mode origin preflight raises ValueError for missing usable cache | detail.code=INITIAL_SYNC_REQUIRED; default demo mode uses analytic fallback |
| 500 | Unhandled downstream provider/cache/calculation exceptions | No consistent application error schema |

No-route returns only:

```json
{"detail":{"code":"NO_ROUTE_FOUND","message":"No route found for the selected endpoints and planning settings."}}
```

Cold-cache route preflight returns:

```json
{"detail":{"code":"INITIAL_SYNC_REQUIRED","message":"No cached satellite data available. Initial sync required."}}
```

These errors contain no successful route/metrics/XAI payload. The message's satellite wording overstates the actual mixed inputs. In default demo mode, unavailable external requests do not block route calculation; analytic wind/current/iceberg models are used. Live-mode `/icebergs` and `/metocean` can still expose unhandled provider/cache failures, and later route-stage failures may become 500. The route decorator explicitly describes 409/422, but not its custom 503.

App identifies NO_ROUTE_FOUND using status and code, treats all 422 as unsupported settings, and treats every 503 as initial-sync-required without inspecting its code.

## Use and compatibility

```powershell
Invoke-RestMethod 'http://localhost:8000/api/health'
Invoke-RestMethod 'http://localhost:8000/api/v1/stations'
# These invoke external-data-dependent calculations:
Invoke-RestMethod 'http://localhost:8000/api/v1/icebergs?forecast_hours=24&safety_buffer_km=30'
Invoke-RestMethod 'http://localhost:8000/api/v1/polar-route?forecast_hours=72&cruising_speed_knots=14.5'
```

Deploy frontend/backend together for planning envelopes, coverage and provenance fields. UI exposes only 24/48/72-hour horizons and retains defaults of 25 km / 14.5 knots. `backend/response.json` is an unused historical sample lacking current explanation, provenance and newer metric fields; it is not a canonical response or offline service.
