"""
Drift Physics Engine Module (Step 3):
Computes 72-hour dead-reckoning trajectory projections for active icebergs
incorporating:
1. Ocean current drag (hydrodynamic keel drag C_ocean ~ 0.88)
2. Atmospheric wind drag (aerodynamic sail drag C_wind ~ 0.032)
3. Coriolis deflection in the Southern Ocean (leftward deflection)
4. Dynamic uncertainty ellipses & 25km+ safety hazard buffer polygons (Shapely)
"""

from typing import List, Dict, Any, Tuple, Optional
import math
from shapely.geometry import Point, Polygon, mapping
from data_engine import Iceberg, MetoceanEngine, get_initial_icebergs


class DriftPhysicsEngine:
    """
    Simulates iceberg drift kinematics and trajectory forecasting over 72 hours.
    Equation:
      V_drift = (V_ocean * C_drag_ocean) + (V_wind * C_drag_wind) + V_coriolis
      Pos(t + dt) = Pos(t) + V_drift * dt
    """

    C_OCEAN_DRAG = 0.88   # Subsurface keel drag coefficient
    C_WIND_DRAG = 0.032    # Atmospheric sail form drag coefficient
    CORIOLIS_DEFLECTION_RAD = math.radians(-18.0)  # ~18 deg leftward deflection in Southern Hemisphere

    @classmethod
    def compute_drift_velocity(cls, lat: float, lon: float, time_hours: float = 0.0) -> Dict[str, float]:
        """
        Calculates instantaneous iceberg drift velocity vector (u_drift, v_drift) in m/s.
        """
        wind = MetoceanEngine.get_wind_vector(lat, lon, time_hours)
        ocean = MetoceanEngine.get_ocean_current(lat, lon, time_hours)

        # Ocean current component
        u_ocean_comp = ocean["u"] * cls.C_OCEAN_DRAG
        v_ocean_comp = ocean["v"] * cls.C_OCEAN_DRAG

        # Wind component with Coriolis deflection (rotate vector left in Southern Hemisphere)
        u_w = wind["u"] * cls.C_WIND_DRAG
        v_w = wind["v"] * cls.C_WIND_DRAG

        cos_c = math.cos(cls.CORIOLIS_DEFLECTION_RAD)
        sin_c = math.sin(cls.CORIOLIS_DEFLECTION_RAD)
        u_wind_rot = u_w * cos_c - v_w * sin_c
        v_wind_rot = u_w * sin_c + v_w * cos_c

        # Net drift vector in m/s
        u_drift = u_ocean_comp + u_wind_rot
        v_drift = v_ocean_comp + v_wind_rot

        speed_mps = math.hypot(u_drift, v_drift)
        speed_knots = speed_mps * 1.94384
        bearing_deg = (math.degrees(math.atan2(u_drift, v_drift)) + 360) % 360

        return {
            "u_mps": u_drift,
            "v_mps": v_drift,
            "speed_mps": round(speed_mps, 4),
            "speed_knots": round(speed_knots, 2),
            "bearing_deg": round(bearing_deg, 1)
        }

    @classmethod
    def project_iceberg_trajectory(
        cls,
        iceberg: Iceberg,
        forecast_hours: int = 72,
        time_step_hours: float = 1.0,
        base_safety_buffer_km: float = 25.0
    ) -> Dict[str, Any]:
        """
        Propagates an iceberg's position forward in time using dead reckoning.
        Returns full trajectory coordinates and snapshots at 0h, 24h, 48h, 72h.
        """
        current_lat = iceberg.lat
        current_lon = iceberg.lon

        trajectory_points = []
        snapshots = {}

        # 1 deg latitude ~ 111.139 km
        KM_PER_DEG_LAT = 111.139

        total_steps = int(forecast_hours / time_step_hours)

        for step in range(total_steps + 1):
            t = step * time_step_hours
            drift = cls.compute_drift_velocity(current_lat, current_lon, t)

            # Cumulative distance drifted in kilometers this step
            dt_seconds = time_step_hours * 3600.0
            dx_m = drift["u_mps"] * dt_seconds
            dy_m = drift["v_mps"] * dt_seconds

            # Dynamic safety radius in km (expands with forecast time and drift speed)
            dynamic_radius_km = base_safety_buffer_km + (iceberg.length_km / 2.0) + (drift["speed_knots"] * 0.12 * (t / 24.0))

            point_record = {
                "step": step,
                "time_hours": round(t, 1),
                "lat": round(current_lat, 4),
                "lon": round(current_lon, 4),
                "speed_knots": drift["speed_knots"],
                "bearing_deg": drift["bearing_deg"],
                "safety_radius_km": round(dynamic_radius_km, 2)
            }
            trajectory_points.append(point_record)

            if step in [0, int(24 / time_step_hours), int(48 / time_step_hours), total_steps]:
                hour_key = f"{int(t)}h"
                snapshots[hour_key] = point_record

            # Update coordinates for next step
            # Latitude delta
            d_lat = (dy_m / 1000.0) / KM_PER_DEG_LAT
            # Longitude delta adjusted for latitude convergence
            cos_lat = max(0.1, math.cos(math.radians(current_lat)))
            d_lon = (dx_m / 1000.0) / (KM_PER_DEG_LAT * cos_lat)

            current_lat += d_lat
            current_lon += d_lon

        # Build predicted 72h state
        final_pt = trajectory_points[-1]
        
        # Build safety hazard buffer polygon (using Shapely in approximate degrees)
        buffer_deg_lat = final_pt["safety_radius_km"] / KM_PER_DEG_LAT
        cos_final = max(0.1, math.cos(math.radians(final_pt["lat"])))
        buffer_deg_lon = final_pt["safety_radius_km"] / (KM_PER_DEG_LAT * cos_final)
        
        # Circle polygon points
        poly_coords = []
        for angle_deg in range(0, 360, 15):
            rad = math.radians(angle_deg)
            p_lat = final_pt["lat"] + buffer_deg_lat * math.sin(rad)
            p_lon = final_pt["lon"] + buffer_deg_lon * math.cos(rad)
            poly_coords.append([round(p_lat, 4), round(p_lon, 4)])
        # Close polygon
        poly_coords.append(poly_coords[0])

        return {
            "iceberg_id": iceberg.id,
            "name": iceberg.name,
            "ice_class": iceberg.ice_class,
            "mass_mt": iceberg.mass_mt,
            "initial_position": {"lat": round(iceberg.lat, 4), "lon": round(iceberg.lon, 4)},
            "predicted_position_72h": {"lat": final_pt["lat"], "lon": final_pt["lon"]},
            "safety_radius_km": final_pt["safety_radius_km"],
            "drift_distance_total_km": round(math.hypot(
                (final_pt["lat"] - iceberg.lat) * KM_PER_DEG_LAT,
                (final_pt["lon"] - iceberg.lon) * KM_PER_DEG_LAT * max(0.1, math.cos(math.radians(iceberg.lat)))
            ), 2),
            "snapshots": snapshots,
            "trajectory_points": trajectory_points,
            "hazard_polygon_coords": poly_coords
        }

    @classmethod
    def get_all_forecasts(
        cls,
        icebergs: Optional[List[Iceberg]] = None,
        forecast_hours: int = 72,
        base_safety_buffer_km: float = 25.0
    ) -> List[Dict[str, Any]]:
        """
        Runs drift forecast for the full catalog of active icebergs.
        """
        if icebergs is None:
            icebergs = get_initial_icebergs()

        forecasts = [
            cls.project_iceberg_trajectory(
                ib,
                forecast_hours=forecast_hours,
                base_safety_buffer_km=base_safety_buffer_km
            )
            for ib in icebergs
        ]
        return forecasts
