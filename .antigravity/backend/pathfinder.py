"""Simulation routing with checked segments, directed costs and explicit limits.

Known land and forecast envelopes are excluded from graph edges. Sea-ice
costs vary by vessel; only open-water ice exclusion is a hard vessel rule.
The land mask is incomplete and the environmental fields are synthetic.
"""
import math
import numpy as np
import networkx as nx
from shapely.geometry import Point, Polygon, LineString
from shapely.ops import unary_union

from data_engine import MetoceanEngine
from drift_engine import DriftPhysicsEngine


class NoRouteFoundError(Exception):
    """The navigation graph has no traversable connection between endpoints."""


from navigation_geometry import haversine_nm, haversine_km, bearing, great_circle_points, segment_distance_km


# =============================================================================
# LAND-SEA MASK  (hand-entered simplified polygons – Indian Ocean sector)
# Boundary points and complete rendered route segments are checked against
# these polygons. This is not a complete or sourced navigational coastline.
# =============================================================================

class LandMask:
    """
    Lightweight land-sea mask built from hand-entered, unverified shoreline
    vertices for the India <-> Southern Ocean shipping corridor.

    Landmasses covered:
      * Sri Lanka (primary culprit causing cross-land routes)
      * Southern Indian Peninsula (Cape Comorin / Kanyakumari region)
      * Maldives atoll chain
      * Lakshadweep Islands
      * Andaman & Nicobar Islands

    Shapely convention: all ring coordinates are (lon, lat) i.e. (x, y).
    The union is built lazily on first use; make_valid() ensures no topology
    exceptions even if a polygon has minor self-intersections.
    """

    # Sri Lanka - approximate coastline (lon, lat)
    _RAW_POLYGONS = [
        # Sri Lanka
        [
            (79.695, 9.835), (80.025, 9.810), (80.240, 9.500),
            (80.740, 9.370), (81.300, 8.560), (81.870, 8.090),
            (81.880, 7.280), (81.640, 6.820), (81.220, 6.200),
            (80.600, 5.940), (80.060, 5.970), (79.710, 6.260),
            (79.510, 6.750), (79.420, 7.290), (79.500, 7.950),
            (79.690, 8.580), (79.695, 9.835),
        ],
        # Southern India - convex-hull approximation (no self-intersections)
        [
            (74.900, 10.200), (76.000,  9.800), (76.300,  8.900),
            (77.100,  8.100), (77.550,  8.100), (78.200,  8.700),
            (79.100,  9.300), (79.900, 10.350), (80.200, 11.000),
            (80.320, 13.400), (80.100, 13.400), (79.500, 13.000),
            (78.000, 11.700), (77.400, 11.000), (76.800, 10.700),
            (75.900, 10.600), (74.900, 10.200),
        ],
        # Maldives - bounding strip for the atoll chain
        [
            (72.600, -0.700), (73.800, -0.700),
            (73.800,  7.200), (72.600,  7.200),
            (72.600, -0.700),
        ],
        # Lakshadweep Islands
        [
            (71.800, 10.000), (74.200, 10.000),
            (74.200, 12.800), (71.800, 12.800),
            (71.800, 10.000),
        ],
        # Andaman & Nicobar Islands
        [
            (92.100,  6.700), (93.200,  6.700),
            (93.200, 13.700), (92.100, 13.700),
            (92.100,  6.700),
        ],
    ]

    _land_union = None  # lazy-loaded on first .is_land() call

    @classmethod
    def _get_land(cls):
        if cls._land_union is None:
            from shapely.validation import make_valid
            polys = [make_valid(Polygon(coords)) for coords in cls._RAW_POLYGONS]
            cls._land_union = unary_union(polys)
        return cls._land_union

    @classmethod
    def is_land(cls, lat: float, lon: float) -> bool:
        """Return True if the (lat, lon) point lies on a landmass."""
        return cls._get_land().covers(Point(lon, lat))  # Shapely: (x=lon, y=lat)


class InvalidRouteInput(ValueError):
    """Invalid or unsupported planning parameters."""


class PolarPathfinder:
    """Bounded simulation planner with checked edges and directed current costs."""

    HAZARD_IMPASSABLE_COST = 99999.0
    MIN_CURRENT_MULTIPLIER = 0.85
    ICE_CLASSES = ("Polar Class 1 (PC1)", "Polar Class 3 (PC3)",
                   "Polar Class 7 (PC7)", "Open Water Vessel")
    MAX_GRID_NODES = 50000

    def __init__(self, grid_resolution_deg=0.8,
                 vessel_ice_class="Polar Class 3 (PC3)", cruising_speed_knots=14.5):
        if not math.isfinite(grid_resolution_deg) or not 0.25 <= grid_resolution_deg <= 2:
            raise InvalidRouteInput("Grid resolution must be between 0.25 and 2 degrees.")
        if vessel_ice_class not in self.ICE_CLASSES:
            raise InvalidRouteInput("Unsupported vessel ice class.")
        if not math.isfinite(cruising_speed_knots) or not 5 <= cruising_speed_knots <= 30:
            raise InvalidRouteInput("Cruising speed must be between 5 and 30 knots.")
        self.res = grid_resolution_deg
        self.vessel_ice_class = vessel_ice_class
        self.cruising_speed_knots = cruising_speed_knots

    @staticmethod
    def validate_route_inputs(start, end, safety_buffer_km=25):
        for coord in (start, end):
            if len(coord) != 2 or not all(math.isfinite(x) for x in coord):
                raise InvalidRouteInput("Coordinates must be finite latitude/longitude pairs.")
            if not -75 <= coord[0] <= 25 or not -180 <= coord[1] <= 180:
                raise InvalidRouteInput("Supported corridor is 75 S to 25 N, longitude -180 to 180.")
        if abs(start[1] - end[1]) >= 180:
            raise InvalidRouteInput("Antimeridian-spanning routes are not supported by this grid.")
        if haversine_nm(*start, *end) < 1e-6:
            raise InvalidRouteInput("Departure and destination must be distinct.")
        if not math.isfinite(safety_buffer_km) or not 5 <= safety_buffer_km <= 100:
            raise InvalidRouteInput("Safety buffer must be between 5 and 100 km.")

    def _get_ice_penalty_factor(self, sic):
        if "PC1" in self.vessel_ice_class:
            return 1 + 3 * sic ** 1.2
        if "PC3" in self.vessel_ice_class:
            return 1 + 8.5 * sic ** 1.4
        if "PC7" in self.vessel_ice_class:
            return 1 + 25 * sic ** 1.6
        return 1 + 80 * sic ** 1.8

    def _ice_allowed(self, sic):
        # Polar Class alone does not specify a certified concentration limit.
        # Open-water planning must not silently enter modeled ice.
        return self.vessel_ice_class != "Open Water Vessel" or sic <= 0

    def _hazards(self, forecasts, buffer_km):
        hazards = []
        for fc in forecasts:
            anchor = fc["predicted_position_72h"]
            center = (anchor["lat"], anchor["lon"])
            samples = fc.get("trajectory_points") or [
                {**fc.get("initial_position", anchor), "safety_radius_km": fc["safety_radius_km"]},
                {**anchor, "safety_radius_km": fc["safety_radius_km"]}
            ]
            # Enclose the entire supplied drift trajectory, not only its final point.
            # Half the longest sample interval adds a conservative allowance for
            # interpolated movement between samples (triangle inequality).
            radius = max(buffer_km, fc["safety_radius_km"])
            for point in samples:
                radius = max(radius, haversine_km(*center, point["lat"], point["lon"])
                             + max(buffer_km, point.get("safety_radius_km", fc["safety_radius_km"])))
            max_gap = max((haversine_km(a["lat"], a["lon"], b["lat"], b["lon"])
                           for a, b in zip(samples, samples[1:])), default=0)
            hazards.append({"id": fc["iceberg_id"], "name": fc["name"],
                            "lat": center[0], "lon": center[1],
                            "radius_km": radius + max_gap / 2,
                            "radius_nm": (radius + max_gap / 2) / 1.852})
        return hazards

    def _node_data(self, point, hazards):
        lat, lon = point
        sic = MetoceanEngine.get_sea_ice_concentration(lat, lon)
        ocean = MetoceanEngine.get_ocean_current(lat, lon)
        wind = MetoceanEngine.get_wind_vector(lat, lon)
        caution, blocked = 0.0, False
        for hz in hazards:
            distance = haversine_km(lat, lon, hz["lat"], hz["lon"])
            blocked |= distance <= hz["radius_km"]
            caution = max(caution, max(0, 2 - distance / hz["radius_km"]) * 40)
        on_land = LandMask.is_land(lat, lon)
        impassable = blocked or on_land or not self._ice_allowed(sic)
        return dict(lat=lat, lon=lon, sic=sic, ocean_u=ocean["u"], ocean_v=ocean["v"],
                    ocean_spd=ocean["speed_knots"], wind_spd=wind["speed_knots"],
                    on_land=on_land, in_hazard=blocked, proximity_caution=caution,
                    base_cost=self.HAZARD_IMPASSABLE_COST if impassable else self._get_ice_penalty_factor(sic) + caution)

    def _segment_clear(self, a, b, hazards):
        if a == b:
            return False
        if any(segment_distance_km((h["lat"], h["lon"]), a, b) <= h["radius_km"] for h in hazards):
            return False
        samples = great_circle_points(a, b)
        if any(not -75 <= p[0] <= 25 for p in samples):
            return False
        # Intersect the whole rendered polyline, so narrow known land barriers
        # between clear endpoints cannot be skipped.
        if LandMask._get_land().intersects(LineString([(p[1], p[0]) for p in samples])):
            return False
        return all(self._ice_allowed(MetoceanEngine.get_sea_ice_concentration(*p)) for p in samples)

    def _edge(self, graph, u, v):
        data = graph.nodes[u]
        alignment = math.cos(bearing(u, v) - math.atan2(data["ocean_u"], data["ocean_v"]))
        multiplier = max(self.MIN_CURRENT_MULTIPLIER, min(1.2, 1 - alignment * data["ocean_spd"] / 20))
        distance = haversine_nm(*u, *v)
        graph.add_edge(u, v, distance_nm=distance,
                       weight=distance * (data["base_cost"] + graph.nodes[v]["base_cost"]) / 2 * multiplier)

    def build_navigation_graph(self, start_coord, end_coord, iceberg_forecasts, safety_buffer_km=25):
        self.validate_route_inputs(start_coord, end_coord, safety_buffer_km)
        low_lat, high_lat = max(-75, min(start_coord[0], end_coord[0]) - 2.5), min(25, max(start_coord[0], end_coord[0]) + 2.5)
        low_lon, high_lon = max(-180, min(start_coord[1], end_coord[1]) - 4.5), min(180, max(start_coord[1], end_coord[1]) + 4.5)
        lats = np.arange(low_lat, high_lat + 1e-9, self.res)
        lons = np.arange(low_lon, high_lon + 1e-9, self.res)
        if len(lats) * len(lons) > self.MAX_GRID_NODES:
            raise InvalidRouteInput("Requested route grid is too large.")
        hazards = self._hazards(iceberg_forecasts, safety_buffer_km)
        graph = nx.DiGraph()
        nodes = {}
        for i, lat in enumerate(lats):
            for j, lon in enumerate(lons):
                point = (float(lat), float(lon))
                data = self._node_data(point, hazards)
                if data["base_cost"] < self.HAZARD_IMPASSABLE_COST:
                    graph.add_node(point, **data)
                    nodes[i, j] = point
        # Check each undirected geometry once, then retain separate costs.
        for (i, j), u in nodes.items():
            for di, dj in [(1, 0), (0, 1), (1, 1), (1, -1)]:
                v = nodes.get((i + di, j + dj))
                if v is not None and self._segment_clear(u, v, hazards):
                    self._edge(graph, u, v)
                    self._edge(graph, v, u)
        endpoints = [tuple(start_coord), tuple(end_coord)]
        for point in endpoints:
            data = self._node_data(point, hazards)
            if data["base_cost"] >= self.HAZARD_IMPASSABLE_COST:
                raise NoRouteFoundError("An endpoint is on known land, in a forecast hazard, or in unsuitable modeled ice.")
            graph.add_node(point, **data)
            for neighbor in nodes.values():
                if neighbor != point and haversine_nm(*point, *neighbor) < self.res * 120 and self._segment_clear(point, neighbor, hazards):
                    self._edge(graph, point, neighbor)
                    self._edge(graph, neighbor, point)
        # Close endpoints need not detour to a coarse grid node.
        if haversine_nm(*endpoints[0], *endpoints[1]) < self.res * 120 and self._segment_clear(*endpoints, hazards):
            self._edge(graph, *endpoints)
            self._edge(graph, endpoints[1], endpoints[0])
        return graph, endpoints, hazards

    def _voyage_metrics(self, points):
        distance, hours, fuel, max_sic = 0.0, 0.0, 0.0, 0.0
        # Explicit illustrative propulsion law, not a vessel-calibrated model.
        daily_burn = 36.5 * (0.2 + 0.8 * (self.cruising_speed_knots / 14.5) ** 3)
        for a, b in zip(points, points[1:]):
            length = haversine_nm(*a, *b)
            sic = max(MetoceanEngine.get_sea_ice_concentration(*p) for p in (a, b))
            duration = length / (self.cruising_speed_knots * (1 - .25 * sic))
            distance += length
            hours += duration
            fuel += duration / 24 * daily_burn * (1 + .45 * sic)
            max_sic = max(max_sic, sic)
        return distance, hours, fuel, max_sic

    def calculate_optimal_route(self, start_coord, end_coord, iceberg_forecasts=None,
                                safety_buffer_km=25, forecast_hours=72):
        self.validate_route_inputs(start_coord, end_coord, safety_buffer_km)
        if not isinstance(forecast_hours, int) or not 0 <= forecast_hours <= 168:
            raise InvalidRouteInput("Forecast horizon must be an integer from 0 to 168 hours.")
        if iceberg_forecasts is None:
            iceberg_forecasts = DriftPhysicsEngine.get_all_forecasts(
                forecast_hours=forecast_hours, base_safety_buffer_km=safety_buffer_km)
        available_hours = min([forecast_hours] + [
            max((p.get("time_hours", 0) for p in fc.get("trajectory_points", [])), default=0)
            for fc in iceberg_forecasts])
        graph, (start, end), hazards = self.build_navigation_graph(
            start_coord, end_coord, iceberg_forecasts, safety_buffer_km)
        try:
            path = nx.astar_path(graph, start, end,
                                 heuristic=lambda a, b: self.MIN_CURRENT_MULTIPLIER * haversine_nm(*a, *b),
                                 weight="weight")
        except (nx.NetworkXNoPath, nx.NodeNotFound) as exc:
            raise NoRouteFoundError("No route found for the selected endpoints and planning settings.") from exc
        # Final defensive validation includes all exact endpoint connectors.
        if any(not self._segment_clear(a, b, hazards) for a, b in zip(path, path[1:])):
            raise NoRouteFoundError("Selected route failed segment validation.")
        points = [path[0]]
        for a, b in zip(path, path[1:]):
            points.extend(great_circle_points(a, b)[1:])
        baseline = great_circle_points(start_coord, end_coord)
        distance, hours, fuel, max_sic = self._voyage_metrics(points)
        direct_distance, direct_hours, direct_fuel, _ = self._voyage_metrics(baseline)
        collisions = [h["id"] for h in hazards if any(
            segment_distance_km((h["lat"], h["lon"]), a, b) <= h["radius_km"]
            for a, b in zip(baseline, baseline[1:]))]
        minimum = min((segment_distance_km((h["lat"], h["lon"]), a, b)
                       for h in hazards for a, b in zip(path, path[1:])), default=None)
        caution = max((graph.nodes[n]["proximity_caution"] for n in path), default=0)
        # Transparent exposure index, not a collision probability or certification.
        risk = round(min(100, max_sic * 100 + caution / 2), 1)
        savings = round((direct_fuel - fuel) / direct_fuel * 100, 1) if direct_fuel > 0 else None
        sample_indices = sorted(set([0, len(path)-1] + list(range(0, len(path), max(1, len(path)//10)))))
        explanations = []
        for idx in sample_indices:
            node = path[idx]
            data = graph.nodes[node]
            explanations.append({"lat": node[0], "lon": node[1], "decision_factors": {
                "sic_value": round(data["sic"], 3),
                "ice_penalty_applied": round(self._get_ice_penalty_factor(data["sic"]), 2),
                "ocean_current_spd_kts": round(data["ocean_spd"], 2),
                "wind_spd_kts": round(data["wind_spd"], 2),
                "base_cost_weight": round(data["base_cost"], 2)}})
        warnings = ["Simplified, incomplete land mask and synthetic environmental data; not verified for navigation.",
                    "Polar Class cost weights are not certified vessel operating limits."]
        if hours > available_hours:
            warnings.append("Voyage extends beyond the supplied iceberg forecast horizon.")
        return {
            "status": "OPTIMAL_ROUTE_COMPUTED",
            "algorithm": "Directed A* with checked spherical segments",
            "origin": {"lat": start[0], "lon": start[1]},
            "destination": {"lat": end[0], "lon": end[1]},
            "vessel_ice_class": self.vessel_ice_class, "cruising_speed_knots": self.cruising_speed_knots,
            "waypoints": [list(p) for p in points],
            "direct_baseline_waypoints": [list(p) for p in baseline],
            "route_metrics": {
                "distance_nautical_miles": round(distance, 1), "distance_km": round(distance * 1.852, 1),
                "direct_distance_nm": round(direct_distance, 1),
                "estimated_voyage_hours": round(hours, 1), "estimated_voyage_days": round(hours / 24, 2),
                "fuel_consumption_tons": round(fuel, 1), "fuel_savings_percent": savings,
                "direct_fuel_consumption_tons": round(direct_fuel, 1),
                "direct_estimated_voyage_hours": round(direct_hours, 1),
                "baseline_is_navigable": all(self._segment_clear(a, b, hazards) for a, b in zip(baseline, baseline[1:])),
                "iceberg_hazard_buffer_km": safety_buffer_km,
                "min_iceberg_distance_km": round(minimum, 1) if minimum is not None else None,
                "forecast_hazards_considered": len(hazards),
                "direct_route_collision_hazards": collisions,
                "max_sea_ice_concentration_pct": round(max_sic * 100, 1),
                "risk_score": risk, "risk_rating": "LOW" if risk < 30 else "MODERATE" if risk < 60 else "HIGH",
                "risk_model": "Uncalibrated ice/proximity exposure index, not a probability",
                "fuel_model": "Illustrative cubic propulsion plus 20% hotel load, 36.5 t/day at 14.5 knots",
                "requested_forecast_hours": forecast_hours,
                "forecast_hours": available_hours, "forecast_covers_voyage": hours <= available_hours,
                "uncovered_voyage_hours": round(max(0, hours - available_hours), 1),
                "hazard_mode": "Conservative envelope of supplied drift trajectory; no arrival-time optimization",
                "warnings": warnings
            },
            "hazard_zones": hazards,
            "xai_explanation": {
                "primary_routing_driver": "Modeled ice, distance, current and forecast-envelope costs",
                "route_modifiers": {
                    "max_sea_ice_penalty_pct": round((self._get_ice_penalty_factor(max_sic) - 1) * 100, 1),
                    "iceberg_proximity_caution": round(caution, 2)},
                "waypoint_explanations": explanations
            }
        }
