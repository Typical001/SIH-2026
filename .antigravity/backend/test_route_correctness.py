"""Adversarial route checks on controlled geography and synthetic fields."""
import asyncio
import math
import unittest
from unittest.mock import patch

import networkx as nx
from shapely.geometry import Polygon, LineString
from data_engine import MetoceanEngine
from navigation_geometry import great_circle_points, haversine_nm, haversine_km, segment_distance_km
from pathfinder import InvalidRouteInput, LandMask, NoRouteFoundError, PolarPathfinder
from test_no_route import request_route


class RouteCorrectnessTests(unittest.TestCase):
    def setUp(self):
        self.land = patch.object(LandMask, '_land_union', Polygon())
        self.ice = patch.object(MetoceanEngine, 'get_sea_ice_concentration', return_value=0)
        self.land.start()
        self.ice.start()
        self.addCleanup(self.land.stop)
        self.addCleanup(self.ice.stop)
        self.engine = PolarPathfinder(grid_resolution_deg=1)

    def test_invalid_engine_inputs(self):
        for a, b in [((-50, 0), (-50, 0)), ((math.nan, 0), (-50, 1)),
                     ((-76, 0), (-50, 1)), ((26, 0), (-50, 1)),
                     ((-50, 181), (-50, 1)), ((-50, -170), (-50, 170))]:
            with self.subTest(a=a, b=b), self.assertRaises(InvalidRouteInput):
                self.engine.calculate_optimal_route(a, b, iceberg_forecasts=[])
        for kwargs in [{'cruising_speed_knots': 0}, {'grid_resolution_deg': 0}, {'vessel_ice_class': 'PC99'}]:
            with self.subTest(kwargs=kwargs), self.assertRaises(InvalidRouteInput):
                PolarPathfinder(**kwargs)

    def test_api_invalid_inputs_rejected_before_forecasting(self):
        queries = [b'start_lat=-50&start_lon=0&end_lat=-50&end_lon=0',
                   b'start_lat=nan', b'start_lon=inf', b'end_lat=-80',
                   b'end_lon=181', b'vessel_ice_class=PC99', b'cruising_speed_knots=0',
                   b'forecast_hours=169', b'start_lon=-170&end_lon=170']
        with patch('main.get_initial_icebergs') as catalog:
            for query in queries:
                with self.subTest(query=query):
                    status, body = asyncio.run(request_route(query))
                    self.assertEqual(status, 422)
                    self.assertNotIn('waypoints', body)
            catalog.assert_not_called()

    def test_metocean_grid_workload_validation(self):
        with patch.object(MetoceanEngine, 'sample_grid_field') as sample:
            for query in [b'lat_step=0', b'lon_step=-1', b'min_lat=10&max_lat=0',
                          b'min_lon=30&max_lon=20', b'lat_step=.25&lon_step=.25']:
                with self.subTest(query=query):
                    status, _ = asyncio.run(request_route(query, '/api/v1/metocean'))
                    self.assertEqual(status, 422)
            sample.assert_not_called()

    def test_http_success_exposes_coverage_and_baseline_metrics(self):
        with patch('main.get_initial_icebergs', return_value=[]):
            status, body = asyncio.run(request_route())
        self.assertEqual(status, 200)
        metrics = body['route_metrics']
        self.assertFalse(metrics['forecast_covers_voyage'])
        self.assertEqual(metrics['forecast_hours'], 0)
        self.assertIsNone(metrics['min_iceberg_distance_km'])
        self.assertGreater(metrics['direct_fuel_consumption_tons'], 0)
        self.assertEqual(body['waypoints'][0], [-34, 18])
        self.assertEqual(body['waypoints'][-1], [-35, 19])

    def test_http_forecast_exposes_actual_planning_radius_and_horizon(self):
        status, body = asyncio.run(request_route(b'start_lat=-34&start_lon=18&end_lat=-35&end_lon=19&forecast_hours=24'))
        self.assertEqual(status, 200)
        self.assertEqual(body['route_metrics']['forecast_hours'], 24)
        self.assertTrue(body['icebergs_predicted_72h'])
        for iceberg in body['icebergs_predicted_72h']:
            self.assertGreaterEqual(iceberg['planning_hazard_radius_km'], iceberg['safety_radius_km'])

    def test_graph_workload_bound(self):
        with self.assertRaises(InvalidRouteInput):
            PolarPathfinder(grid_resolution_deg=.25).build_navigation_graph((-74, 0), (24, 170), [])

    def test_thin_land_barrier_cannot_be_jumped(self):
        # Full-height strip far thinner than a graph cell; nodes either side are water.
        barrier = Polygon([(-.001, -60), (.001, -60), (.001, -40), (-.001, -40)])
        with patch.object(LandMask, '_land_union', barrier):
            self.assertFalse(self.engine._segment_clear((-50, -1), (-50, 1), []))
            with self.assertRaises(NoRouteFoundError):
                self.engine.calculate_optimal_route((-50, -1), (-50, 1), iceberg_forecasts=[])

    def test_route_detours_around_finite_land_barrier(self):
        barrier = Polygon([(-.01, -50.5), (.01, -50.5), (.01, -49.5), (-.01, -49.5)])
        with patch.object(LandMask, '_land_union', barrier):
            result = self.engine.calculate_optimal_route((-50, -1), (-50, 1), iceberg_forecasts=[])
        line = LineString([(lon, lat) for lat, lon in result['waypoints']])
        self.assertFalse(line.intersects(barrier))
        self.assertGreater(result['route_metrics']['distance_nautical_miles'], result['route_metrics']['direct_distance_nm'])
        self.assertLess(result['route_metrics']['fuel_savings_percent'], 0)
        self.assertFalse(result['route_metrics']['baseline_is_navigable'])

    def test_land_endpoint_is_not_forced_into_graph(self):
        with patch.object(LandMask, '_land_union', Polygon([(-1, -51), (1, -51), (1, -49), (-1, -49)])):
            with self.assertRaises(NoRouteFoundError):
                self.engine.calculate_optimal_route((-50, 0), (-52, 2), iceberg_forecasts=[])

    def test_hazard_between_clear_endpoints_blocks_edge(self):
        hazard = {'lat': 0, 'lon': 1, 'radius_km': 5}
        self.assertGreater(haversine_km(0, 0, 0, 1), 5)
        self.assertAlmostEqual(segment_distance_km((0, 1), (0, 0), (0, 2)), 0)
        self.assertFalse(self.engine._segment_clear((0, 0), (0, 2), [hazard]))
        self.assertAlmostEqual(segment_distance_km((0, 3), (0, 0), (0, 2)), haversine_km(0, 2, 0, 3))

    def test_earlier_forecast_position_remains_in_planning_envelope(self):
        forecast = {'iceberg_id': 'moving', 'name': 'moving', 'safety_radius_km': 5,
                    'predicted_position_72h': {'lat': -50, 'lon': 3},
                    'trajectory_points': [{'lat': -50, 'lon': 0, 'safety_radius_km': 5},
                                          {'lat': -50, 'lon': 3, 'safety_radius_km': 5}]}
        hazards = self.engine._hazards([forecast], 5)
        self.assertFalse(self.engine._segment_clear((-50, -1), (-50, 1), hazards))
        with self.assertRaises(NoRouteFoundError):
            self.engine.calculate_optimal_route((-50, 0), (-51, 1), [forecast], 5)

    def test_directed_weights_and_admissible_search_match_dijkstra(self):
        with patch.object(MetoceanEngine, 'get_ocean_current', return_value={'u': 1, 'v': 0, 'speed_knots': 2}):
            graph, (start, end), _ = self.engine.build_navigation_graph((-50, 0), (-51, 1), [])
        self.assertTrue(graph.is_directed())
        u, v = next((u, v) for u, v in graph.edges if u[0] == v[0] and u[1] < v[1])
        self.assertLess(graph[u][v]['weight'], graph[v][u]['weight'])
        path = nx.astar_path(graph, start, end, heuristic=lambda a, b: .85 * haversine_nm(*a, *b), weight='weight')
        self.assertAlmostEqual(nx.path_weight(graph, path, 'weight'), nx.dijkstra_path_length(graph, start, end, weight='weight'))
        for a, b, data in graph.edges(data=True):
            self.assertGreaterEqual(data['weight'] + 1e-9, .85 * haversine_nm(*a, *b))

    def test_exact_endpoints_and_real_endpoint_explanations(self):
        a, b = (-50.00001, .00002), (-50.00004, .00008)
        result = self.engine.calculate_optimal_route(a, b, iceberg_forecasts=[])
        self.assertEqual(result['waypoints'][0], list(a))
        self.assertEqual(result['waypoints'][-1], list(b))
        self.assertGreater(len(result['waypoints']), 1)
        samples = result['xai_explanation']['waypoint_explanations']
        self.assertEqual(samples[-1]['lat'], b[0])
        self.assertEqual(samples[-1]['decision_factors']['sic_value'], 0)
        self.assertEqual(samples[-1]['decision_factors']['base_cost_weight'], 1)

    def test_baseline_geometry_matches_great_circle_distance(self):
        a, b = (-50, 0), (-60, 40)
        points = great_circle_points(a, b)
        length = sum(haversine_nm(*u, *v) for u, v in zip(points, points[1:]))
        self.assertAlmostEqual(length, haversine_nm(*a, *b), places=6)
        self.assertTrue(all(haversine_km(*u, *v) <= 5.00001 for u, v in zip(points, points[1:])))
        self.assertNotAlmostEqual(points[len(points)//2][0], -55, places=1)

    def test_open_water_vessel_cannot_enter_modeled_ice(self):
        with patch.object(MetoceanEngine, 'get_sea_ice_concentration', return_value=.8):
            with self.assertRaises(NoRouteFoundError):
                PolarPathfinder(vessel_ice_class='Open Water Vessel').calculate_optimal_route((-50, 0), (-51, 1), iceberg_forecasts=[])
            result = self.engine.calculate_optimal_route((-50, 0), (-51, 1), iceberg_forecasts=[])
        self.assertGreaterEqual(result['route_metrics']['risk_score'], 80)
        self.assertEqual(result['route_metrics']['risk_rating'], 'HIGH')

    def test_interior_ice_is_checked_for_open_water_vessel(self):
        engine = PolarPathfinder(vessel_ice_class='Open Water Vessel')
        with patch.object(MetoceanEngine, 'get_sea_ice_concentration', side_effect=lambda lat, lon: .5 if abs(lon) < .2 else 0):
            self.assertFalse(engine._segment_clear((-50, -1), (-50, 1), []))

    def test_speed_dependent_fuel_and_forecast_coverage(self):
        results = [PolarPathfinder(cruising_speed_knots=speed).calculate_optimal_route((-50, 0), (-51, 1), iceberg_forecasts=[], forecast_hours=0)['route_metrics'] for speed in (10, 20)]
        self.assertGreater(results[1]['fuel_consumption_tons'], results[0]['fuel_consumption_tons'])
        self.assertLess(results[1]['estimated_voyage_hours'], results[0]['estimated_voyage_hours'])
        self.assertIsNone(results[0]['min_iceberg_distance_km'])
        self.assertFalse(results[0]['forecast_covers_voyage'])
        self.assertGreater(results[0]['uncovered_voyage_hours'], 0)

    def test_supplied_forecast_shorter_than_requested_is_not_overstated(self):
        forecast = {'iceberg_id': 'far', 'name': 'far', 'safety_radius_km': 5,
                    'predicted_position_72h': {'lat': -20, 'lon': 50},
                    'trajectory_points': [{'lat': -20, 'lon': 50, 'time_hours': 0},
                                          {'lat': -20, 'lon': 50, 'time_hours': 2}]}
        result = self.engine.calculate_optimal_route((-50, 0), (-51, 1), [forecast], forecast_hours=72)
        self.assertEqual(result['route_metrics']['forecast_hours'], 2)
        self.assertFalse(result['route_metrics']['forecast_covers_voyage'])

    def test_final_validation_rejects_an_unchecked_connector(self):
        start, end = (0, 0), (0, 2)
        graph = nx.DiGraph()
        graph.add_edge(start, end, weight=1)
        hazards = [{'lat': 0, 'lon': 1, 'radius_km': 5}]
        with patch.object(self.engine, 'build_navigation_graph', return_value=(graph, [start, end], hazards)):
            with self.assertRaises(NoRouteFoundError):
                self.engine.calculate_optimal_route(start, end, iceberg_forecasts=[])


if __name__ == '__main__':
    unittest.main()
