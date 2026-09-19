"""
FastAPI Backend Application:
SIH Problem Statement 26059: Dynamic Route Optimization & Iceberg Movement Forecasting for Polar Navigation.

API Endpoints:
- GET /api/v1/polar-route: Comprehensive A* safe navigation path & metrics
- GET /api/v1/icebergs: Active & 72-hour projected iceberg coordinates with drift trajectories
- GET /api/v1/metocean: Metocean vector grid (ERA5 Wind, HYCOM Currents, AMSR2 Sea Ice)
- GET /api/v1/stations: Polar stations & departure ports
- GET /api/health: Service health & telemetry state
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any, Literal
import math
import uvicorn

from data_engine import (
    get_initial_icebergs,
    POLAR_STATIONS,
    MetoceanEngine,
    Iceberg,
    fetch_environmental_layer
    , set_live_data_enabled
)
from drift_engine import DriftPhysicsEngine
from pathfinder import InvalidRouteInput, NoRouteFoundError, PolarPathfinder

app = FastAPI(
    title="PolarNav: Dynamic Route Optimization & Iceberg Forecasting",
    description="Production-ready prototype for SIH Problem Statement 26059 (Southern Ocean / Antarctica Passage)",
    version="1.0.0"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PolarNav Dynamic Routing API",
        "version": "1.0.0",
        "cors_enabled": True,
        "live_data_feeds": {
            "era5_wind": "Open-Meteo Weather API (Live + Model Fallback)",
            "hycom_currents": "Open-Meteo Marine / HYCOM (Live + Model Fallback)",
            "usnic_icebergs": "USNIC / NOAA GeoJSON Feed (Live + Model Fallback)",
            "amsr2_sea_ice": "AMSR2 Passive Microwave Model"
        },
        "physics_engine": "72h Dead-Reckoning Integrator (ERA5 + HYCOM)",
        "pathfinding_engine": "A-Star NetworkX Multi-Factor Spatial Graph",
        "timestamp_utc": "2026-09-18T12:00:00Z"
    }


@app.get("/api/v1/stations")
def get_stations():
    """
    Returns preset polar stations and departure ports.
    """
    return {
        "status": "success",
        "stations": POLAR_STATIONS
    }


@app.get("/api/v1/icebergs")
def get_icebergs(
    forecast_hours: int = Query(72, ge=0, le=168, description="Forecast horizon in hours"),
    safety_buffer_km: float = Query(25.0, ge=5.0, le=100.0, description="Base safety buffer radius in km")
):
    """
    Returns active iceberg observations and dead-reckoning trajectory forecasts.
    """
    icebergs = get_initial_icebergs()
    forecasts = DriftPhysicsEngine.get_all_forecasts(
        icebergs=icebergs,
        forecast_hours=forecast_hours,
        base_safety_buffer_km=safety_buffer_km
    )

    icebergs_present = [ib.to_dict() for ib in icebergs]
    icebergs_predicted_72h = [
        {
            "id": fc["iceberg_id"],
            "name": fc["name"],
            "lat": fc["predicted_position_72h"]["lat"],
            "lon": fc["predicted_position_72h"]["lon"],
            "safety_radius_km": fc["safety_radius_km"],
            "drift_distance_total_km": fc["drift_distance_total_km"],
            "hazard_polygon": fc["hazard_polygon_coords"],
            "snapshots": fc["snapshots"]
        }
        for fc in forecasts
    ]

    return {
        "status": "success",
        "forecast_hours": forecast_hours,
        "total_icebergs": len(icebergs),
        "icebergs_present": icebergs_present,
        "icebergs_predicted_72h": icebergs_predicted_72h,
        "detailed_forecasts": forecasts
    }


@app.get("/api/v1/metocean")
def get_metocean_grid(
    min_lat: float = Query(-72.0, ge=-90, le=90),
    max_lat: float = Query(-32.0, ge=-90, le=90),
    min_lon: float = Query(10.0, ge=-180, le=180),
    max_lon: float = Query(85.0, ge=-180, le=180),
    lat_step: float = Query(3.0, ge=0.25, le=20),
    lon_step: float = Query(4.0, ge=0.25, le=20)
):
    """
    Returns sampled metocean vector fields (wind, current, sea ice).
    """
    if min_lat > max_lat or min_lon > max_lon:
        raise HTTPException(422, detail={"code": "INVALID_BOUNDS", "message": "Minimum bounds must not exceed maximum bounds."})
    if (math.ceil((max_lat - min_lat) / lat_step) + 1) * (math.ceil((max_lon - min_lon) / lon_step) + 1) > 10000:
        raise HTTPException(422, detail={"code": "GRID_TOO_LARGE", "message": "Metocean grid is limited to 10000 samples."})
    grid = MetoceanEngine.sample_grid_field(
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
        lat_step=lat_step,
        lon_step=lon_step
    )
    return {
        "status": "success",
        "grid": grid
    }


@app.get("/api/v1/polar-route", responses={
    409: {"description": "No route found in the navigation graph (detail.code: NO_ROUTE_FOUND)."},
    422: {"description": "Invalid or unsupported route inputs."}
})
def get_polar_route(
    start_lat: float = Query(-33.9249, ge=-75, le=25, description="Departure latitude (Default: Cape Town)"),
    start_lon: float = Query(18.4241, ge=-180, le=180, description="Departure longitude (Default: Cape Town)"),
    end_lat: float = Query(-69.4125, ge=-75, le=25, description="Arrival latitude (Default: Bharati Station)"),
    end_lon: float = Query(76.1872, ge=-180, le=180, description="Arrival longitude (Default: Bharati Station)"),
    forecast_hours: int = Query(72, ge=0, le=168, description="Forecast horizon in hours"),
    vessel_ice_class: Literal["Polar Class 1 (PC1)", "Polar Class 3 (PC3)", "Polar Class 7 (PC7)", "Open Water Vessel"] = Query("Polar Class 3 (PC3)", description="Vessel Ice Class"),
    safety_buffer_km: float = Query(25.0, ge=5.0, le=100.0, description="Iceberg safety hazard buffer in km"),
    cruising_speed_knots: float = Query(14.5, ge=5.0, le=30.0, description="Vessel cruising speed in knots"),
    backtest_date: Optional[str] = Query(None, description="Optional YYYY-MM-DD date for historical ERA5 reanalysis backtesting"),
    data_mode: Literal["offline", "online"] = Query("offline", description="Offline analytic demo data or online provider requests")
):
    """
    Calculates a simulated A* route avoiding the supplied forecast envelopes.
    Returns:
    - waypoints: Array of [lat, lng] coordinates for the generated A* green navigation path
    - icebergs_present: Array of current iceberg coordinates
    - icebergs_predicted_72h: Array of predicted iceberg coordinates with dynamic safety radii
    - route_metrics: Distance in nautical miles, estimated voyage time, risk score, and data source metadata
    """
    try:
        PolarPathfinder.validate_route_inputs((start_lat, start_lon), (end_lat, end_lon), safety_buffer_km)
    except InvalidRouteInput as exc:
        raise HTTPException(422, detail={"code": "INVALID_ROUTE_INPUT", "message": str(exc)}) from exc

    # Keep the default showcase path deterministic and fast. Online mode is
    # explicit because provider latency/rate limits can make route planning slow.
    set_live_data_enabled(data_mode == "online")

    # 1. Fetch Environmental Layer & Check Offline Status / Cache
    try:
        env_layer = fetch_environmental_layer(start_lat, start_lon)
    except ValueError as val_exc:
        raise HTTPException(
            status_code=503,
            detail={"code": "INITIAL_SYNC_REQUIRED", "message": "No cached satellite data available. Initial sync required."}
        ) from val_exc
    except Exception:
        env_layer = {
            "is_offline": True,
            "data_source": "Offline Cache",
            "last_synced_timestamp": None
        }

    is_offline = env_layer.get("is_offline", False)
    data_source_label = env_layer.get("data_source", "Live ECMWF / USNIC Feed")
    last_synced_timestamp = env_layer.get("last_synced_timestamp")

    # 2. Ingest Icebergs
    icebergs = get_initial_icebergs()

    # 3. Compute the requested forecast horizon.
    forecasts = DriftPhysicsEngine.get_all_forecasts(
        icebergs=icebergs,
        forecast_hours=forecast_hours,
        base_safety_buffer_km=safety_buffer_km
    )

    # 4. Compute A* Optimal Route
    pathfinder = PolarPathfinder(
        grid_resolution_deg=0.85,
        vessel_ice_class=vessel_ice_class,
        cruising_speed_knots=cruising_speed_knots
    )

    try:
        route_data = pathfinder.calculate_optimal_route(
            start_coord=(start_lat, start_lon),
            end_coord=(end_lat, end_lon),
            iceberg_forecasts=forecasts,
            safety_buffer_km=safety_buffer_km,
            forecast_hours=forecast_hours
        )
    except InvalidRouteInput as exc:
        raise HTTPException(422, detail={"code": "INVALID_ROUTE_INPUT", "message": str(exc)}) from exc
    except NoRouteFoundError as exc:
        raise HTTPException(status_code=409, detail={
            "code": "NO_ROUTE_FOUND",
            "message": "No route found for the selected endpoints and planning settings."
        }) from exc

    planning_radii = {h["id"]: h["radius_km"] for h in route_data["hazard_zones"]}
    # Preserve legacy response fields and add the actual planning envelope.
    icebergs_present = [ib.to_dict() for ib in icebergs]
    icebergs_predicted_72h = [
        {
            "id": fc["iceberg_id"],
            "name": fc["name"],
            "lat": fc["predicted_position_72h"]["lat"],
            "lon": fc["predicted_position_72h"]["lon"],
            "initial_lat": fc["initial_position"]["lat"],
            "planning_hazard_radius_km": math.ceil(planning_radii[fc["iceberg_id"]] * 1000) / 1000,
            "initial_lon": fc["initial_position"]["lon"],
            "safety_radius_km": fc["safety_radius_km"],
            "safety_radius_nm": round(fc["safety_radius_km"] / 1.852, 1),
            "drift_distance_total_km": fc["drift_distance_total_km"],
            "hazard_polygon": fc["hazard_polygon_coords"],
            "trajectory_points": fc["trajectory_points"],
            "snapshots": fc["snapshots"]
        }
        for fc in forecasts
    ]

    route_metrics = route_data["route_metrics"]
    route_metrics["data_source"] = data_source_label
    route_metrics["is_offline"] = is_offline
    route_metrics["last_synced_timestamp"] = last_synced_timestamp

    return {
        "waypoints": route_data["waypoints"],
        "direct_baseline_waypoints": route_data["direct_baseline_waypoints"],
        "icebergs_present": icebergs_present,
        "icebergs_predicted_72h": icebergs_predicted_72h,
        "route_metrics": route_metrics,
        "data_source": data_source_label,
        "is_offline": is_offline,
        "last_synced_timestamp": last_synced_timestamp,
        "origin": route_data["origin"],
        "destination": route_data["destination"],
        "vessel_ice_class": vessel_ice_class,
        "forecast_hours": forecast_hours,
        "xai_explanation": route_data["xai_explanation"]
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
