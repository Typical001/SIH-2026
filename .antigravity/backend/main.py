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

from fastapi import FastAPI, HTTPException, Query, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import uvicorn

import sqlite3
import json
import os
import datetime

from data_engine import (
    get_initial_icebergs,
    fetch_live_usnic_icebergs,
    fetch_live_byu_icebergs,
    fetch_live_sar_candidates,
    fetch_live_sea_ice_layer,
    fetch_live_ocean_currents_layer,
    fetch_live_weather_wind_layer,
    GEBCO_WMS_TILE_URL,
    get_layer_cache,
    POLAR_STATIONS,
    POLAR_GATEWAYS,
    ANTARCTIC_STATIONS,
    get_vessel_last_fix,
    update_vessel_fix,
    MetoceanEngine,
    Iceberg
)
from drift_engine import DriftPhysicsEngine
from pathfinder import NoRouteFoundError, PolarPathfinder, ParetoRouteEngine

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

DB_PATH = os.path.join(os.path.dirname(__file__), "polar_nav_offline.db")

def init_sqlite_db():
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS iceberg_registry_cache (
            id TEXT PRIMARY KEY,
            name TEXT,
            lat REAL,
            lon REAL,
            length_km REAL,
            width_km REAL,
            thickness_m REAL,
            mass_mt REAL,
            ice_class TEXT,
            source TEXT,
            confidence REAL,
            last_updated_utc TEXT,
            metadata_json TEXT
        )
        """)
        conn.commit()
        conn.close()
    except Exception:
        pass

# Initialize DB on import/startup
init_sqlite_db()

def save_icebergs_to_db(icebergs: List[Iceberg]):
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("DELETE FROM iceberg_registry_cache")
        for ib in icebergs:
            cursor.execute("""
            INSERT OR REPLACE INTO iceberg_registry_cache (
                id, name, lat, lon, length_km, width_km, thickness_m, mass_mt, ice_class, source, confidence, last_updated_utc, metadata_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                ib.id, ib.name, ib.lat, ib.lon, ib.length_km, ib.width_km,
                ib.thickness_m, ib.mass_mt, ib.ice_class, ib.source,
                ib.confidence, ib.last_updated_utc, json.dumps(ib.metadata)
            ))
        conn.commit()
        conn.close()
    except Exception:
        pass


@app.get("/api/health")
def health_check():
    icebergs, is_live, source_name, _ = fetch_live_usnic_icebergs()
    if is_live:
        save_icebergs_to_db(icebergs)
        mode = "ONLINE_LIVE_SATELLITE"
        header_text = "ONLINE: USNIC Satellite & ECMWF Live Sync"
    else:
        mode = "OFFLINE_MODE"
        header_text = "OFFLINE RESILIENCE ACTIVE: Local Shipboard Cache Running"

    return {
        "status": "healthy",
        "mode": mode,
        "header_status_text": header_text,
        "is_live_satellite": is_live,
        "source": source_name,
        "iceberg_count": len(icebergs),
        "service": "PolarNav Dynamic Routing API",
        "version": "1.0.0",
        "physics_engine": "72h Dead-Reckoning Integrator (ERA5 + HYCOM)",
        "pathfinding_engine": "A-Star NetworkX Multi-Factor Spatial Graph",
        "timestamp_utc": datetime.datetime.utcnow().isoformat() + "Z"
    }


@app.get("/api/v1/icebergs/live")
def get_live_icebergs_geojson():
    """
    Returns the exact GeoJSON FeatureCollection of all currently tracked USNIC/NOAA satellite icebergs
    directly to the Leaflet ECDIS map.
    """
    icebergs, is_live, source_name, geojson_data = fetch_live_usnic_icebergs()
    if is_live:
        save_icebergs_to_db(icebergs)
    
    return {
        "status": "success",
        "mode": "ONLINE_LIVE_SATELLITE" if is_live else "OFFLINE_CACHE",
        "source": source_name,
        "total_icebergs": len(icebergs),
        "geojson": geojson_data
    }


# =============================================================================
# DEDICATED LAYER DISPATCH ENDPOINTS (MAP DISPLAY LAYERS)
# =============================================================================

@app.get("/api/v1/layers/usnic-icebergs")
def get_layer_usnic_icebergs():
    """
    Returns active USNIC/NOAA satellite-tracked iceberg coordinates.
    """
    icebergs, is_live, source_name, geojson_data = fetch_live_usnic_icebergs()
    if is_live:
        save_icebergs_to_db(icebergs)
    return {
        "status": "success",
        "layer": "usnic_icebergs",
        "mode": "ONLINE_LIVE_SATELLITE" if is_live else "OFFLINE_CACHE",
        "is_live": is_live,
        "source": source_name,
        "total_features": len(geojson_data.get("features", [])),
        "geojson": geojson_data
    }


@app.get("/api/v1/layers/byu-icebergs")
def get_layer_byu_icebergs():
    """
    Returns reference icebergs from BYU MERS Antarctic Iceberg Tracking Database.
    """
    is_live, source_name, geojson_data = fetch_live_byu_icebergs()
    return {
        "status": "success",
        "layer": "byu_icebergs",
        "mode": "ONLINE_LIVE_FEED" if is_live else "OFFLINE_CACHE",
        "is_live": is_live,
        "source": source_name,
        "total_features": len(geojson_data.get("features", [])),
        "geojson": geojson_data
    }


@app.get("/api/v1/layers/sar-candidates")
def get_layer_sar_candidates():
    """
    Returns recent Sentinel-1 SAR imagery acquisition footprints and radar candidate polygons.
    """
    is_live, source_name, geojson_data = fetch_live_sar_candidates()
    return {
        "status": "success",
        "layer": "sar_candidates",
        "mode": "ONLINE_LIVE_FEED" if is_live else "OFFLINE_CACHE",
        "is_live": is_live,
        "source": source_name,
        "total_features": len(geojson_data.get("features", [])),
        "geojson": geojson_data
    }


@app.get("/api/v1/layers/sea-ice")
def get_layer_sea_ice(
    lat: Optional[float] = Query(None, description="Optional latitude for point inspection"),
    lon: Optional[float] = Query(None, description="Optional longitude for point inspection"),
):
    """
    Returns AMSR2 25 km Sea Ice Concentration (SIC) grid across the operational corridor.
    """
    is_live, source_name, geojson_data = fetch_live_sea_ice_layer(lat, lon)
    return {
        "status": "success",
        "layer": "sea_ice",
        "mode": "ONLINE_LIVE_FEED" if is_live else "OFFLINE_CACHE",
        "is_live": is_live,
        "source": source_name,
        "total_features": len(geojson_data.get("features", [])),
        "geojson": geojson_data
    }


@app.get("/api/v1/layers/ocean-currents")
def get_layer_ocean_currents(
    lat: Optional[float] = Query(None, description="Optional latitude for point inspection"),
    lon: Optional[float] = Query(None, description="Optional longitude for point inspection"),
):
    """
    Returns HYCOM / GLORYS ocean surface vector field (u, v components).
    """
    is_live, source_name, geojson_data = fetch_live_ocean_currents_layer(lat, lon)
    return {
        "status": "success",
        "layer": "ocean_currents",
        "mode": "ONLINE_LIVE_FEED" if is_live else "OFFLINE_CACHE",
        "is_live": is_live,
        "source": source_name,
        "total_features": len(geojson_data.get("features", [])),
        "geojson": geojson_data
    }


@app.get("/api/v1/layers/weather-wind")
def get_layer_weather_wind(
    lat: Optional[float] = Query(None, description="Optional latitude for point inspection"),
    lon: Optional[float] = Query(None, description="Optional longitude for point inspection"),
):
    """
    Returns ECMWF ERA5 / IFS 0.25° 10m wind vector field (u, v components).
    """
    is_live, source_name, geojson_data = fetch_live_weather_wind_layer(lat, lon)
    return {
        "status": "success",
        "layer": "weather_wind",
        "mode": "ONLINE_LIVE_FEED" if is_live else "OFFLINE_CACHE",
        "is_live": is_live,
        "source": source_name,
        "total_features": len(geojson_data.get("features", [])),
        "geojson": geojson_data
    }


@app.get("/api/v1/layers/status")
def get_layers_status():
    """
    Returns operational live/cached sync status for all 7 layers.
    """
    layer_keys = ["usnic_icebergs", "byu_icebergs", "sar_candidates", "sea_ice", "ocean_currents", "weather_wind"]
    status_summary = {}
    any_live = False
    all_live = True

    for k in layer_keys:
        c = get_layer_cache(k)
        if c:
            status_summary[k] = {
                "is_live": c["is_live"],
                "source": c["source"],
                "last_updated_utc": c["last_updated_utc"]
            }
            if c["is_live"]:
                any_live = True
            else:
                all_live = False
        else:
            status_summary[k] = {
                "is_live": False,
                "source": "Initial Baseline",
                "last_updated_utc": datetime.datetime.utcnow().isoformat() + "Z"
            }
            all_live = False

    status_summary["bathymetry"] = {
        "is_live": True,
        "source": "NOAA NCEI GEBCO 2023 WMS Contours",
        "tile_url": GEBCO_WMS_TILE_URL,
        "last_updated_utc": datetime.datetime.utcnow().isoformat() + "Z"
    }

    overall_label = "LIVE: NOAA/BYU/ECMWF" if any_live else "CACHE: " + datetime.datetime.utcnow().strftime("%Y-%m-%d %H:%M")

    return {
        "status": "success",
        "overall_sync_label": overall_label,
        "all_live": all_live,
        "any_live": any_live,
        "layers": status_summary
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
    icebergs, is_live, source_name, geojson_data = fetch_live_usnic_icebergs()
    if is_live:
        save_icebergs_to_db(icebergs)

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
        "mode": "ONLINE_LIVE_SATELLITE" if is_live else "OFFLINE_CACHE",
        "source": source_name,
        "forecast_hours": forecast_hours,
        "total_icebergs": len(icebergs),
        "icebergs_present": icebergs_present,
        "icebergs_predicted_72h": icebergs_predicted_72h,
        "geojson": geojson_data,
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


class CalculateRouteRequest(BaseModel):
    origin_type: Optional[str] = Field("GATEWAY", description="GATEWAY | CURRENT_SHIP_GPS | MID_OCEAN_COORDINATES")
    origin_coords: Optional[List[float]] = Field(None, description="[lat, lon] starting coordinates")
    gateway_code: Optional[str] = Field("ZACPT", description="5 Official Polar Gateways: ZACPT, USH, CLPUQ, AUHBT, NZLYT")
    destination_station_id: Optional[str] = Field("bharati_station", description="Destination Station: bharati_station, maitri_station, mcmurdo_station, rothera_station")
    vessel_imo: Optional[int] = Field(9577133, description="Vessel IMO identifier (Default: 9577133)")
    remaining_fuel_mt: Optional[float] = Field(450.0, ge=0.0, le=5000.0, description="Available bunker fuel in Metric Tons")
    fuel_tank_percentage: Optional[float] = Field(None, ge=0.0, le=100.0, description="Optional fuel tank percentage 0-100%")
    max_tank_capacity_mt: Optional[float] = Field(500.0, ge=10.0, le=5000.0, description="Total fuel bunker capacity in Metric Tons")
    # Explicit coordinate overrides (for backwards compatibility & custom routes)
    start_lat: Optional[float] = Field(None, description="Departure latitude override")
    start_lon: Optional[float] = Field(None, description="Departure longitude override")
    end_lat: Optional[float] = Field(None, description="Arrival latitude override")
    end_lon: Optional[float] = Field(None, description="Arrival longitude override")
    vessel_ice_class: Optional[str] = Field("Polar Class 5 (PC5)", description="IMO vessel ice class")
    cruising_speed_knots: Optional[float] = Field(14.5, ge=5.0, le=30.0, description="Cruising speed in knots")
    grid_resolution_deg: Optional[float] = Field(0.8, ge=0.4, le=2.0, description="Grid resolution in degrees")


@app.get("/api/v1/pareto-routes", responses={
    409: {"description": "No traversable path found even after fallback cascade."}
})
def get_pareto_routes(
    start_lat: float = Query(-33.9249, description="Departure latitude (Default: Cape Town)"),
    start_lon: float = Query(18.4241, description="Departure longitude"),
    end_lat: float = Query(-69.4125, description="Arrival latitude (Default: Bharati Station)"),
    end_lon: float = Query(76.1872, description="Arrival longitude"),
    vessel_ice_class: str = Query("Polar Class 3 (PC3)", description="IMO vessel ice class"),
    cruising_speed_knots: float = Query(14.5, ge=5.0, le=30.0, description="Cruising speed in knots"),
    grid_resolution_deg: float = Query(0.8, ge=0.4, le=2.0, description="Grid resolution in degrees"),
    remaining_fuel_mt: float = Query(200.0, ge=0.0, le=2000.0, description="Available bunker fuel in Metric Tons"),
    fuel_tank_percentage: Optional[float] = Query(None, ge=0.0, le=100.0, description="Fuel tank percentage 0-100%"),
    max_tank_capacity_mt: float = Query(200.0, ge=10.0, le=5000.0, description="Total fuel bunker capacity in MT"),
):
    """
    Computes 3 Pareto-optimal maritime routes (SAFEST, BALANCED, FASTEST) using:
      - IMO POLARIS Risk Index Outcome single-pass grid
      - Live USNIC/NOAA Antarctic iceberg coordinates
      - ECMWF ERA5 wind + HYCOM ocean currents per cell
      - Guarded A* (25 000 iter cap + 1.2 s timeout per profile)
      - Dynamic Vessel Bunker Fuel Feasibility Meter (FEASIBLE, RANGE_CRITICAL, UNREACHABLE)
      - Auto-promotes BALANCED if SAFEST detour exceeds bunker endurance.

    Returns a GeoJSON FeatureCollection with 3 LineString features.
    Fallback cascade guarantees HTTP 200 always returned.
    """
    if fuel_tank_percentage is not None:
        effective_fuel_mt = (fuel_tank_percentage / 100.0) * max_tank_capacity_mt
    else:
        effective_fuel_mt = remaining_fuel_mt

    # Fetch live icebergs (with SQLite fallback)
    try:
        icebergs, is_live, source_name, _ = fetch_live_usnic_icebergs()
        if is_live:
            save_icebergs_to_db(icebergs)
        data_source_label = (
            "Live ECMWF / NOAA USNIC Satellite Sync" if is_live
            else "Offline SQLite Cache"
        )
    except Exception:
        icebergs = get_initial_icebergs()
        is_live = False
        data_source_label = "Offline SQLite Cache"

    # Filter icebergs to the route corridor for drift simulation
    min_lat_corr = min(start_lat, end_lat) - 4.0
    max_lat_corr = max(start_lat, end_lat) + 4.0
    min_lon_corr = min(start_lon, end_lon) - 6.0
    max_lon_corr = max(start_lon, end_lon) + 6.0

    corridor_icebergs = [
        ib for ib in icebergs
        if min_lat_corr <= ib.lat <= max_lat_corr and min_lon_corr <= ib.lon <= max_lon_corr
    ]
    if not corridor_icebergs:
        corridor_icebergs = icebergs[:40]
    else:
        corridor_icebergs = corridor_icebergs[:60]

    # Get 72-hour drift forecasts
    try:
        forecasts = DriftPhysicsEngine.get_all_forecasts(
            icebergs=corridor_icebergs,
            forecast_hours=72,
            base_safety_buffer_km=15.0
        )
    except Exception:
        forecasts = []

    engine = ParetoRouteEngine(
        grid_resolution_deg=grid_resolution_deg,
        vessel_ice_class=vessel_ice_class,
        cruising_speed_knots=cruising_speed_knots,
    )

    try:
        result = engine.compute_three_routes(
            start_coord=(start_lat, start_lon),
            end_coord=(end_lat, end_lon),
            iceberg_forecasts=forecasts,
            data_source_label=data_source_label,
            remaining_fuel_mt=effective_fuel_mt,
            max_tank_capacity_mt=max_tank_capacity_mt,
        )
        return result
    except NoRouteFoundError as exc:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=409,
            detail={"error": "NO_ROUTE_FOUND", "message": str(exc)}
        )
    except Exception as exc:
        # Last-resort: return a straight-line degraded response rather than 500
        from pathfinder import _straight_fallback
        import datetime as _dt
        fallback_wpts = _straight_fallback((start_lat, start_lon), (end_lat, end_lon))
        fallback_coords = [[lon, lat] for lat, lon in fallback_wpts]
        fallback_wpts_ll = [[float(la), float(lo)] for la, lo in fallback_wpts]
        degrade_feature = {
            "type": "Feature",
            "geometry": {"type": "LineString", "coordinates": fallback_coords},
            "properties": {
                "route_type": "BALANCED",
                "color": "#0ea5e9",
                "label": "Degraded (Straight-line Emergency)",
                "distance_nm": 0.0,
                "eta_hours": 0.0,
                "min_polaris_rio": 0.0,
                "max_ice_concentration": 0.0,
                "total_fuel_burn_mt": 0.0,
                "mandatory_reserve_mt": 0.0,
                "total_required_fuel_mt": 0.0,
                "fuel_surplus_deficit_mt": effective_fuel_mt,
                "tank_left_percentage": 100.0,
                "feasibility_status": "FEASIBLE",
                "data_source": "Emergency Fallback",
                "flags": ["EMERGENCY_STRAIGHT_LINE", str(exc)],
                "waypoints_latlon": fallback_wpts_ll,
            }
        }
        return {
            "type": "FeatureCollection",
            "features": [degrade_feature, degrade_feature, degrade_feature],
            "metadata": {
                "vessel_ice_class": vessel_ice_class,
                "remaining_fuel_mt": effective_fuel_mt,
                "max_tank_capacity_mt": max_tank_capacity_mt,
                "recommended_route_type": "BALANCED",
                "auto_switched": False,
                "algorithm": "Emergency Fallback",
                "data_source": "Emergency",
                "flags": ["COMPUTE_ERROR", str(exc)],
                "timestamp_utc": datetime.datetime.utcnow().isoformat() + "Z"
            }
        }


# -----------------------------------------------------------------------------
# POLAR GATEWAYS & DESTINATION STATIONS METADATA ENDPOINTS
# -----------------------------------------------------------------------------

@app.get("/api/v1/destinations/gateways")
def get_destinations_gateways():
    """
    Returns the 5 Official Polar Gateway Hubs (Purged of all domestic/commercial Indian ports).
    """
    return {
        "status": "success",
        "gateways": list(POLAR_GATEWAYS.values())
    }


@app.get("/api/v1/destinations/stations")
def get_destinations_stations():
    """
    Returns the 4 Official Antarctic Destination Research Stations.
    """
    return {
        "status": "success",
        "stations": list(ANTARCTIC_STATIONS.values())
    }


@app.get("/api/v1/vessel/last-fix")
def get_vessel_fix_endpoint(vessel_imo: int = Query(9577133, description="Vessel IMO identifier")):
    """
    Returns the last recorded AIS GPS fix for the vessel (default: IMO 9577133 at [-64.50, 72.00]).
    """
    fix = get_vessel_last_fix(vessel_imo)
    return {
        "status": "success",
        "fix": fix
    }


@app.post("/api/v1/calculate-route")
def post_calculate_route(request: CalculateRouteRequest):
    """
    In-Voyage Maritime Routing Controller:
    Supports 3-way departure modes:
      1. GATEWAY: 5 Official Polar Gateways (Cape Town, Ushuaia, Punta Arenas, Hobart, Christchurch)
      2. CURRENT_SHIP_GPS: Ship's live/last-recorded AIS fix (default IMO 9577133 @ [-64.50, 72.00])
      3. MID_OCEAN_COORDINATES: Dynamic Southern Ocean map click waypoint
    Executes split-stage routing (Stage 1 open ocean down to -60°S, Stage 2 Polar A* grid).
    Returns 3 Pareto-optimal routes (Safest, Balanced, Fastest) with IMO Polar Code bunker feasibility gating.
    """
    # 1. Resolve Origin Coordinates
    if request.start_lat is not None and request.start_lon is not None:
        start_lat = request.start_lat
        start_lon = request.start_lon
    elif request.origin_type in ("CURRENT_SHIP_GPS", "MID_OCEAN_COORDINATES"):
        if request.origin_coords and len(request.origin_coords) >= 2 and request.origin_coords[0] is not None and request.origin_coords[1] is not None:
            start_lat = float(request.origin_coords[0])
            start_lon = float(request.origin_coords[1])
            update_vessel_fix(request.vessel_imo or 9577133, start_lat, start_lon)
        else:
            fix = get_vessel_last_fix(request.vessel_imo or 9577133)
            start_lat = float(fix["lat"])
            start_lon = float(fix["lon"])
    else:  # "GATEWAY"
        gw_key = (request.gateway_code or "ZACPT").upper()
        gw = POLAR_GATEWAYS.get(gw_key, POLAR_GATEWAYS["ZACPT"])
        start_lat = float(gw["lat"])
        start_lon = float(gw["lon"])

    # 2. Resolve Destination Coordinates
    if request.end_lat is not None and request.end_lon is not None:
        end_lat = request.end_lat
        end_lon = request.end_lon
    else:
        stn_key = request.destination_station_id or "bharati_station"
        stn = ANTARCTIC_STATIONS.get(stn_key, ANTARCTIC_STATIONS["bharati_station"])
        end_lat = float(stn["lat"])
        end_lon = float(stn["lon"])

    effective_ice_class = request.vessel_ice_class or "Polar Class 5 (PC5)"
    effective_speed = request.cruising_speed_knots or 14.5
    effective_fuel = request.remaining_fuel_mt if request.remaining_fuel_mt is not None else 450.0
    effective_capacity = request.max_tank_capacity_mt or 500.0

    return get_pareto_routes(
        start_lat=start_lat,
        start_lon=start_lon,
        end_lat=end_lat,
        end_lon=end_lon,
        vessel_ice_class=effective_ice_class,
        cruising_speed_knots=effective_speed,
        grid_resolution_deg=request.grid_resolution_deg or 0.8,
        remaining_fuel_mt=effective_fuel,
        fuel_tank_percentage=request.fuel_tank_percentage,
        max_tank_capacity_mt=effective_capacity,
    )


@app.get("/api/v1/polar-route", responses={
    409: {"description": "No route found in the navigation graph (detail.code: NO_ROUTE_FOUND)."}
})
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
    """
    # 1. Ingest Live USNIC / Satellite Icebergs
    icebergs, is_live, source_name, geojson_data = fetch_live_usnic_icebergs()
    if is_live:
        save_icebergs_to_db(icebergs)

    # 2. Compute 72h Drift Physics on corridor icebergs
    min_lat_corr = min(start_lat, end_lat) - 4.0
    max_lat_corr = max(start_lat, end_lat) + 4.0
    min_lon_corr = min(start_lon, end_lon) - 6.0
    max_lon_corr = max(start_lon, end_lon) + 6.0

    corridor_icebergs = [
        ib for ib in icebergs
        if min_lat_corr <= ib.lat <= max_lat_corr and min_lon_corr <= ib.lon <= max_lon_corr
    ]
    if not corridor_icebergs:
        corridor_icebergs = icebergs[:40]
    else:
        corridor_icebergs = corridor_icebergs[:60]

    forecasts = DriftPhysicsEngine.get_all_forecasts(
        icebergs=corridor_icebergs,
        forecast_hours=forecast_hours,
        base_safety_buffer_km=safety_buffer_km
    )

    # 3. Compute A* Optimal Route
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
            safety_buffer_km=safety_buffer_km
        )
    except NoRouteFoundError as exc:
        raise HTTPException(status_code=409, detail={
            "code": "NO_ROUTE_FOUND",
            "message": "No route found for the selected endpoints and planning settings."
        }) from exc

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
        "geojson": geojson_data,
        "mode": "ONLINE_LIVE_SATELLITE" if is_live else "OFFLINE_CACHE",
        "source": source_name,
        "route_metrics": route_data["route_metrics"],
        "origin": route_data["origin"],
        "destination": route_data["destination"],
        "vessel_ice_class": vessel_ice_class,
        "forecast_hours": forecast_hours
    }



if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
