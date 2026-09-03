"""
Data Engine Module (Step 1 & 2):
Ingests and simulates real-time data streams:
1. Active iceberg coordinates (latitude, longitude, size, mass) simulating USNIC tracking data.
2. ERA5 Wind Vector Fields (u, v components in m/s) with synoptic polar fronts.
3. HYCOM Surface Ocean Currents (u, v components in m/s) with Antarctic Circumpolar Current (ACC) dynamics.
4. AMSR2 Sea Ice Concentration (SIC) grid (0.0 to 1.0).
"""

from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional
import numpy as np
import math


@dataclass
class Iceberg:
    id: str
    name: str
    lat: float
    lon: float
    length_km: float
    width_km: float
    thickness_m: float
    mass_mt: float  # Megatonnes
    ice_class: str
    source: str = "USNIC-NIC"
    confidence: float = 0.98
    last_updated_utc: str = "2026-09-02T12:00:00Z"
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "name": self.name,
            "lat": round(self.lat, 4),
            "lon": round(self.lon, 4),
            "length_km": self.length_km,
            "width_km": self.width_km,
            "thickness_m": self.thickness_m,
            "mass_mt": round(self.mass_mt, 1),
            "ice_class": self.ice_class,
            "source": self.source,
            "confidence": self.confidence,
            "last_updated_utc": self.last_updated_utc,
            "metadata": self.metadata,
        }


# Base Polar Stations & Ports for Route Planning
POLAR_STATIONS = {
    "cape_town": {
        "id": "cape_town",
        "name": "Cape Town Port (South Africa)",
        "lat": -33.9249,
        "lon": 18.4241,
        "type": "port",
        "country": "South Africa"
    },
    "bharati_station": {
        "id": "bharati_station",
        "name": "Bharati Research Station (Larsemann Hills)",
        "lat": -69.4125,
        "lon": 76.1872,
        "type": "antarctic_station",
        "country": "India"
    },
    "maitri_station": {
        "id": "maitri_station",
        "name": "Maitri Research Station (Schirmacher Oasis)",
        "lat": -70.7667,
        "lon": 11.7333,
        "type": "antarctic_station",
        "country": "India"
    },
    "mcmurdo_station": {
        "id": "mcmurdo_station",
        "name": "McMurdo Station (Ross Island)",
        "lat": -77.8419,
        "lon": 166.6863,
        "type": "antarctic_station",
        "country": "USA"
    },
    "casey_station": {
        "id": "casey_station",
        "name": "Casey Station (Wilkes Land)",
        "lat": -66.2822,
        "lon": 110.5283,
        "type": "antarctic_station",
        "country": "Australia"
    },
    "rothera_station": {
        "id": "rothera_station",
        "name": "Rothera Research Station (Antarctic Peninsula)",
        "lat": -67.5700,
        "lon": -68.1300,
        "type": "antarctic_station",
        "country": "UK"
    }
}


def get_initial_icebergs() -> List[Iceberg]:
    """
    Returns high-priority active iceberg positions in the Southern Ocean
    corridor between South Africa and East Antarctica (Prydz Bay & Dronning Maud Land).
    Simulates USNIC satellite tracking catalog.
    """
    raw_icebergs = [
        Iceberg(
            id="IB-A23A",
            name="Iceberg A23a (Mega-Tabular)",
            lat=-58.450,
            lon=34.200,
            length_km=42.0,
            width_km=36.0,
            thickness_m=350.0,
            mass_mt=980000.0,
            ice_class="Tabular Giant",
            metadata={"status": "Active Drift", "drift_trend": "NE into ACC Jet"}
        ),
        Iceberg(
            id="IB-D30A",
            name="Iceberg D-30A (Amery Calving)",
            lat=-64.820,
            lon=68.450,
            length_km=18.5,
            width_km=8.2,
            thickness_m=280.0,
            mass_mt=38000.0,
            ice_class="Tabular Major",
            metadata={"status": "Prydz Bay Outflow", "drift_trend": "NW drift"}
        ),
        Iceberg(
            id="IB-B15K",
            name="Iceberg B-15K Remnant",
            lat=-61.150,
            lon=54.800,
            length_km=9.8,
            width_km=4.5,
            thickness_m=220.0,
            mass_mt=8500.0,
            ice_class="Pinnacled/Tabular",
            metadata={"status": "Rapid Melting Zone", "drift_trend": "E-NE drift"}
        ),
        Iceberg(
            id="IB-PRYDZ-01",
            name="Bharati Approach Hazard Alpha",
            lat=-67.120,
            lon=73.850,
            length_km=6.2,
            width_km=3.1,
            thickness_m=190.0,
            mass_mt=3200.0,
            ice_class="Medium Tabular",
            metadata={"status": "Fast Ice Boundary", "critical_hazard": True}
        ),
        Iceberg(
            id="IB-PRYDZ-02",
            name="Bharati Approach Hazard Beta",
            lat=-68.250,
            lon=75.400,
            length_km=4.5,
            width_km=2.8,
            thickness_m=175.0,
            mass_mt=1950.0,
            ice_class="Growler Cluster / Bergy Bit",
            metadata={"status": "Larsemann Channel Throat", "critical_hazard": True}
        ),
        Iceberg(
            id="IB-ROAR-44",
            name="Roaring 50s Drift Target #44",
            lat=-51.200,
            lon=26.700,
            length_km=7.5,
            width_km=3.8,
            thickness_m=210.0,
            mass_mt=5200.0,
            ice_class="Tabular",
            metadata={"status": "ACC Core Zone", "drift_trend": "Rapid Eastward"}
        ),
        Iceberg(
            id="IB-MID-56",
            name="Mid-Ocean Sub-Polar #56",
            lat=-55.800,
            lon=44.100,
            length_km=11.2,
            width_km=5.6,
            thickness_m=260.0,
            mass_mt=14800.0,
            ice_class="Large Tabular",
            metadata={"status": "Deep Water Drift", "drift_trend": "E-SE drift"}
        ),
        Iceberg(
            id="IB-MAITRI-01",
            name="Maitri Approach Hazard #01",
            lat=-68.800,
            lon=14.200,
            length_km=8.1,
            width_km=4.2,
            thickness_m=230.0,
            mass_mt=6900.0,
            ice_class="Medium Tabular",
            metadata={"status": "Dronning Maud Shelf", "drift_trend": "W-SW Coastal"}
        ),
        Iceberg(
            id="IB-MAITRI-02",
            name="Maitri Coastal Fast Ice Drift",
            lat=-69.950,
            lon=12.500,
            length_km=5.4,
            width_km=2.9,
            thickness_m=180.0,
            mass_mt=2400.0,
            ice_class="Calved Fragment",
            metadata={"status": "Near Shelf Zone", "drift_trend": "Westward"}
        ),
        Iceberg(
            id="IB-ACC-71",
            name="Polar Front Vortex Berg #71",
            lat=-47.600,
            lon=21.900,
            length_km=5.1,
            width_km=2.3,
            thickness_m=160.0,
            mass_mt=1600.0,
            ice_class="Degraded Blocky",
            metadata={"status": "Warm Water Melting", "drift_trend": "E-NE drift"}
        ),
        Iceberg(
            id="IB-ACC-89",
            name="Crozet Plateau Drift #89",
            lat=-46.300,
            lon=49.700,
            length_km=6.8,
            width_km=3.4,
            thickness_m=200.0,
            mass_mt=4100.0,
            ice_class="Medium Tabular",
            metadata={"status": "Subantarctic Convergence", "drift_trend": "E drift"}
        ),
        Iceberg(
            id="IB-EAST-103",
            name="Enderby Basin Drift Berg #103",
            lat=-62.900,
            lon=61.300,
            length_km=9.4,
            width_km=4.7,
            thickness_m=240.0,
            mass_mt=9500.0,
            ice_class="Large Tabular",
            metadata={"status": "Gyre Circulation", "drift_trend": "Cyclonic"}
        )
    ]
    return raw_icebergs


class MetoceanEngine:
    """
    Computes realistic ERA5 Wind Vectors and HYCOM Ocean Currents across
    the Southern Ocean (Antarctica domain).
    """

    @staticmethod
    def get_wind_vector(lat: float, lon: float, time_hours: float = 0.0) -> Dict[str, float]:
        """
        Calculates ERA5 wind vector (u_wind = eastward, v_wind = northward) in m/s.
        Models:
        - Westerlies (Roaring Forties / Furious Fifties ~ 40°S to 60°S): High eastward u > 0.
        - Polar Easterlies (near 65°S to 75°S): Westward u < 0 + katabatic offshore v < 0.
        - Synoptic cyclonic low pressure disturbances.
        """
        abs_lat = abs(lat)
        # Synoptic wave phase
        wave_phase = math.radians(lon * 2.5 + time_hours * 3.5)
        
        if abs_lat < 40.0:
            # Subtropical ridge
            u_base = 6.0 + 3.0 * math.sin(wave_phase)
            v_base = -2.0 + 1.5 * math.cos(wave_phase)
        elif 40.0 <= abs_lat < 62.0:
            # Roaring 40s / Furious 50s Westerlies jet
            core_factor = math.exp(-((abs_lat - 52.0) ** 2) / 60.0)
            u_base = 14.0 * core_factor + 6.0 + 4.5 * math.sin(wave_phase * 1.3)
            v_base = -1.5 + 3.5 * math.cos(wave_phase * 1.3)
        else:
            # Polar Easterlies / Coastal Katabatic
            u_base = -7.5 - 2.5 * math.sin(wave_phase)
            v_base = -3.8 - 2.0 * math.cos(wave_phase)  # Katabatic northward outflow off ice shelf
        
        speed = math.hypot(u_base, v_base)
        direction_deg = (math.degrees(math.atan2(u_base, v_base)) + 360) % 360

        return {
            "u": round(u_base, 3),
            "v": round(v_base, 3),
            "speed_mps": round(speed, 2),
            "speed_knots": round(speed * 1.94384, 1),
            "direction_deg": round(direction_deg, 1)
        }

    @staticmethod
    def get_ocean_current(lat: float, lon: float, time_hours: float = 0.0) -> Dict[str, float]:
        """
        Calculates HYCOM ocean surface current (u_ocean = eastward, v_ocean = northward) in m/s.
        Models:
        - Antarctic Circumpolar Current (ACC): Dominant eastward jet (0.25 to 0.55 m/s) between 45°S and 60°S.
        - Antarctic Coastal Current (East Wind Drift): Westward coastal flow (-0.15 to -0.35 m/s) south of 65°S.
        - Meso-scale mesoscale eddies and bathymetric steering.
        """
        abs_lat = abs(lat)
        eddy_phase = math.radians(lon * 4.0 + time_hours * 1.2)
        
        if abs_lat < 42.0:
            # Subtropical gyre
            u_curr = 0.12 + 0.05 * math.sin(eddy_phase)
            v_curr = -0.04 + 0.03 * math.cos(eddy_phase)
        elif 42.0 <= abs_lat < 63.0:
            # ACC Core Jet
            acc_peak = math.exp(-((abs_lat - 53.0) ** 2) / 50.0)
            u_curr = 0.42 * acc_peak + 0.08 + 0.07 * math.sin(eddy_phase)
            v_curr = 0.04 + 0.06 * math.cos(eddy_phase)
        else:
            # Antarctic Coastal Current (East Wind Drift - westward)
            u_curr = -0.22 - 0.06 * math.sin(eddy_phase)
            v_curr = 0.02 + 0.04 * math.cos(eddy_phase)

        speed = math.hypot(u_curr, v_curr)
        direction_deg = (math.degrees(math.atan2(u_curr, v_curr)) + 360) % 360

        return {
            "u": round(u_curr, 4),
            "v": round(v_curr, 4),
            "speed_mps": round(speed, 3),
            "speed_knots": round(speed * 1.94384, 2),
            "direction_deg": round(direction_deg, 1)
        }

    @staticmethod
    def get_sea_ice_concentration(lat: float, lon: float) -> float:
        """
        Returns Sea Ice Concentration (SIC) [0.0 = Open Water, 1.0 = 100% Solid Pack Ice].
        Simulates satellite AMSR2 passive microwave observations.
        - North of 59°S: Open water (0.0)
        - 59°S to 65°S: Marginal Ice Zone (0.1 to 0.6)
        - 65°S to 72°S: Close/Consolidated Pack Ice (0.6 to 0.95)
        """
        abs_lat = abs(lat)
        if abs_lat < 58.5:
            return 0.0
        elif 58.5 <= abs_lat < 64.0:
            # Marginal ice zone
            fraction = (abs_lat - 58.5) / 5.5
            # Add spatial longitude variation (e.g. Weddell vs Prydz Bay)
            lon_var = 0.12 * math.sin(math.radians(lon * 2.0))
            sic = max(0.0, min(0.65, 0.55 * (fraction ** 1.4) + lon_var))
            return round(sic, 3)
        else:
            # Close to heavy pack ice
            fraction = (abs_lat - 64.0) / 8.0
            sic = 0.60 + 0.35 * min(1.0, fraction)
            return round(min(0.98, sic), 3)

    @classmethod
    def sample_grid_field(cls, min_lat: float = -72.0, max_lat: float = -32.0,
                          min_lon: float = 10.0, max_lon: float = 85.0,
                          lat_step: float = 2.5, lon_step: float = 3.5) -> Dict[str, Any]:
        """
        Generates structured metocean grid data for visualization on frontend map overlays.
        """
        lats = np.arange(min_lat, max_lat + 0.1, lat_step)
        lons = np.arange(min_lon, max_lon + 0.1, lon_step)

        grid_points = []
        for lat in lats:
            for lon in lons:
                wind = cls.get_wind_vector(lat, lon)
                ocean = cls.get_ocean_current(lat, lon)
                sic = cls.get_sea_ice_concentration(lat, lon)
                grid_points.append({
                    "lat": round(float(lat), 2),
                    "lon": round(float(lon), 2),
                    "wind_u": wind["u"],
                    "wind_v": wind["v"],
                    "wind_spd_kts": wind["speed_knots"],
                    "ocean_u": ocean["u"],
                    "ocean_v": ocean["v"],
                    "ocean_spd_kts": ocean["speed_knots"],
                    "sic": sic
                })

        return {
            "bounds": {"min_lat": min_lat, "max_lat": max_lat, "min_lon": min_lon, "max_lon": max_lon},
            "points": grid_points,
            "total_points": len(grid_points)
        }
