# API reference

Source: `backend/main.py`, reviewed 2026-09-17 at `dccfa3b`. Local base: `http://localhost:8000`. All application endpoints use GET and return JSON. Interactive schema is available at `/docs`, ReDoc at `/redoc`, and OpenAPI JSON at `/openapi.json` while the service runs. No authentication or explicit response models are configured.

## Endpoints

| Path | Response |
| --- | --- |
| `/api/health` | `status`, `service`, `version`, engine descriptions, `timestamp_utc` |
| `/api/v1/stations` | `status: success`, `stations` dictionary keyed by station ID |
| `/api/v1/icebergs` | `status`, `forecast_hours`, `total_icebergs`, `icebergs_present`, `icebergs_predicted_72h`, `detailed_forecasts` |
| `/api/v1/metocean` | `status`, `grid` containing bounds, points and total_points |
| `/api/v1/polar-route` | Waypoints, baseline, initial/predicted icebergs, metrics, endpoints, vessel class, horizon and `xai_explanation` |

Health reports a fixed timestamp `2026-09-02T12:00:00Z`; it does not check data freshness, provider reachability or routing correctness.

## Route query parameters

| Parameter | Type | Default | Enforced range |
| --- | --- | --- | --- |
| `start_lat` | float | -33.9249 | None |
| `start_lon` | float | 18.4241 | None |
| `end_lat` | float | -69.4125 | None |
| `end_lon` | float | 76.1872 | None |
| `forecast_hours` | integer | 72 | 0–168 |
| `vessel_ice_class` | string | Polar Class 3 (PC3) | No enum validation |
| `safety_buffer_km` | float | 25 | 5–100 |
| `cruising_speed_knots` | float | 14.5 | 5–30 |

`/api/v1/icebergs` accepts the same forecast and buffer parameters. `/api/v1/stations` and `/api/health` have no query parameters.

`/api/v1/metocean` accepts float parameters `min_lat=-72`, `max_lat=-32`, `min_lon=10`, `max_lon=85`, `lat_step=3`, `lon_step=4`. Positive step sizes, ordered bounds and maximum sample counts are not enforced by the API. Use small bounded grids.

## Response details

`waypoints` and `direct_baseline_waypoints` are arrays of `[lat, lon]`. `origin` and `destination` are `{lat, lon}` objects. Route responses contain `forecast_hours` and `vessel_ice_class`, but omit the pathfinder's internal status, algorithm name and hazard_zones list.

Initial iceberg records contain `id`, `name`, `lat`, `lon`, `length_km`, `width_km`, `thickness_m`, `mass_mt`, `ice_class`, `source`, `confidence`, `last_updated_utc`, and `metadata`.

Predicted route iceberg records contain `id`, `name`, `lat`, `lon`, `initial_lat`, `initial_lon`, `safety_radius_km`, `safety_radius_nm`, `drift_distance_total_km`, `hazard_polygon`, `trajectory_points`, and `snapshots`. The standalone iceberg endpoint's compact predictions omit initial coordinates, nautical radius and trajectory_points; full forecasts are separately included in `detailed_forecasts`.

Trajectory records contain `step`, `time_hours`, `lat`, `lon`, `speed_knots`, `bearing_deg`, and `safety_radius_km`. Snapshot keys are strings such as `0h`, `24h`, `48h` and the selected terminal horizon. Legacy `72h` field names do not force a 72-hour forecast.

| Metric field | Meaning / units |
| --- | --- |
| `distance_nautical_miles`, `distance_km` | Summed computed-route distance |
| `direct_distance_nm` | Endpoint great-circle distance |
| `estimated_voyage_hours`, `estimated_voyage_days` | Modeled transit time |
| `fuel_consumption_tons` | Modeled fuel mass |
| `fuel_savings_percent` | Comparison with modeled baseline, floored at 4.5 |
| `iceberg_hazard_buffer_km` | Requested base buffer, not full effective radius |
| `min_iceberg_distance_km` | Minimum sampled segment-midpoint distance to predicted centers |
| `icebergs_avoided_count` | Number of catalog hazard circles, not verified encounters avoided |
| `direct_route_collision_hazards` | Unique IDs hit by sampled baseline points |
| `max_sea_ice_concentration_pct` | Maximum sampled segment-midpoint SIC × 100 |
| `risk_score`, `risk_rating` | Heuristic score capped at 28, consequently LOW |
| `latency_compensation_status` | Fixed 72-hour status text |

Metocean points contain `lat`, `lon`, `wind_u`, `wind_v`, `wind_spd_kts`, `ocean_u`, `ocean_v`, `ocean_spd_kts`, and `sic`. Vector components are m/s; `sic` is a fraction. Positive u is eastward and positive v is northward.

## Example requests and errors

```powershell
Invoke-RestMethod 'http://localhost:8000/api/health'
Invoke-RestMethod 'http://localhost:8000/api/v1/icebergs?forecast_hours=24&safety_buffer_km=30'
Invoke-RestMethod 'http://localhost:8000/api/v1/polar-route?forecast_hours=72&cruising_speed_knots=14.5'
```

FastAPI returns HTTP 422 for query type/range validation failures. Unhandled calculation failures can return 500. Failed graph searches currently generate fallback geometry and can return HTTP 200 as described below. Successful HTTP transport does not establish route validity.

## Explanation payload — added in c996de7

The route endpoint adds `xai_explanation` with this structure:

```json
{
  "primary_routing_driver": "Distance & Current Optimization",
  "route_modifiers": {
    "max_sea_ice_penalty_pct": 0.0,
    "iceberg_proximity_caution": 0.0
  },
  "waypoint_explanations": [
    {
      "lat": -34.0,
      "lon": 18.0,
      "decision_factors": {
        "sic_value": 0.0,
        "ice_penalty_applied": 1.0,
        "ocean_current_spd_kts": 0.0,
        "wind_spd_kts": 0.0,
        "base_cost_weight": 1.0
      }
    }
  ]
}
```

This is a schema example containing one waypoint sample, not a complete route response. `sic_value` is a fraction; ice penalty and base cost are dimensionless weights; speeds are knots. The driver switches to “Iceberg Avoidance & Sea Ice Minimization” when maximum sampled SIC exceeds 0.1. The proximity modifier is 10 or 0 at a 35 km threshold and is not the graph's actual maximum proximity weight. Samples may exceed ten. Endpoint SIC and missing-node defaults can be synthetic; explanation values are not independently validated observations. See [ARCHITECTURE.md](ARCHITECTURE.md).

## Graph failure — regression in current API

The former HTTP 409 / `NO_ROUTE_FOUND` contract is **not implemented at dccfa3b**. It existed in 6097e6c and was removed in c996de7. Restoring the test file in dccfa3b did not restore the exception or handler.

On NetworkXNoPath or NodeNotFound the pathfinder creates 25 interpolated waypoints, calculates ordinary metrics/explanations and returns through the normal success response. The API omits the engine status and has no fallback flag, so clients cannot reliably distinguish this from an A* route. An in-process all-land probe returned HTTP 200 and LOW risk. Reintroducing explicit failure remains NAV-02; do not document 409 as a currently supported outcome.

## UI/API differences and sample artifact

The UI sends 24/48/72 hours (two labels incorrectly use days), 25 km buffer and 14.5 knots; broader API limits above are unchanged. It does not fetch `/api/v1/metocean` even though a layer toggle is present.

`backend/response.json` is a saved JSON response without the new explanation property; neither application code nor tests load it. It is not a canonical current contract, a live observation or an offline data service.
