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

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List, Dict, Any
import uvicorn

from data_engine import (
    get_initial_icebergs,
    POLAR_STATIONS,
    MetoceanEngine,
    Iceberg
)
from drift_engine import DriftPhysicsEngine
from pathfinder import PolarPathfinder

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
        "physics_engine": "72h Dead-Reckoning Integrator (ERA5 + HYCOM)",
        "pathfinding_engine": "A-Star NetworkX Multi-Factor Spatial Graph",
        "timestamp_utc": "2026-09-02T12:00:00Z"
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
    min_lat: float = Query(-72.0),
    max_lat: float = Query(-32.0),
    min_lon: float = Query(10.0),
    max_lon: float = Query(85.0),
    lat_step: float = Query(3.0),
    lon_step: float = Query(4.0)
):
    """
    Returns sampled metocean vector fields (wind, current, sea ice).
    """
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


@app.get("/api/v1/polar-route")
def get_polar_route(
    start_lat: float = Query(-33.9249, description="Departure latitude (Default: Cape Town)"),
    start_lon: float = Query(18.4241, description="Departure longitude (Default: Cape Town)"),
    end_lat: float = Query(-69.4125, description="Arrival latitude (Default: Bharati Station)"),
    end_lon: float = Query(76.1872, description="Arrival longitude (Default: Bharati Station)"),
    forecast_hours: int = Query(72, ge=0, le=168, description="Forecast horizon in hours"),
    vessel_ice_class: str = Query("Polar Class 3 (PC3)", description="Vessel Ice Class"),
    safety_buffer_km: float = Query(25.0, ge=5.0, le=100.0, description="Iceberg safety hazard buffer in km"),
    cruising_speed_knots: float = Query(14.5, ge=5.0, le=30.0, description="Vessel cruising speed in knots")
):
    """
    Calculates the dynamic A* polar navigation route avoiding 72h predicted icebergs.
    Returns:
    - waypoints: Array of [lat, lng] coordinates for the generated A* green navigation path
    - icebergs_present: Array of current iceberg coordinates
    - icebergs_predicted_72h: Array of predicted iceberg coordinates with dynamic safety radii
    - route_metrics: Distance in nautical miles, estimated voyage time, and risk score
    """
    # 1. Ingest Icebergs
    icebergs = get_initial_icebergs()

    # 2. Compute 72h Drift Physics
    forecasts = DriftPhysicsEngine.get_all_forecasts(
        icebergs=icebergs,
        forecast_hours=forecast_hours,
        base_safety_buffer_km=safety_buffer_km
    )

    # 3. Compute A* Optimal Route
    pathfinder = PolarPathfinder(
        grid_resolution_deg=0.85,
        vessel_ice_class=vessel_ice_class,
        cruising_speed_knots=cruising_speed_knots
    )

    route_data = pathfinder.calculate_optimal_route(
        start_coord=(start_lat, start_lon),
        end_coord=(end_lat, end_lon),
        iceberg_forecasts=forecasts,
        safety_buffer_km=safety_buffer_km
    )

    # Format response adhering strictly to SIH specification
    icebergs_present = [ib.to_dict() for ib in icebergs]
    icebergs_predicted_72h = [
        {
            "id": fc["iceberg_id"],
            "name": fc["name"],
            "lat": fc["predicted_position_72h"]["lat"],
            "lon": fc["predicted_position_72h"]["lon"],
            "initial_lat": fc["initial_position"]["lat"],
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

    return {
        "waypoints": route_data["waypoints"],
        "direct_baseline_waypoints": route_data["direct_baseline_waypoints"],
        "icebergs_present": icebergs_present,
        "icebergs_predicted_72h": icebergs_predicted_72h,
        "route_metrics": route_data["route_metrics"],
        "origin": route_data["origin"],
        "destination": route_data["destination"],
        "vessel_ice_class": vessel_ice_class,
        "forecast_hours": forecast_hours,
        "xai_explanation": route_data["xai_explanation"]
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
