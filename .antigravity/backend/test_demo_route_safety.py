"""Deterministic geometry and error regressions; no live requests or real DB writes."""
import sqlite3
import tempfile
import unittest
from unittest.mock import patch

from shapely.geometry import box
from shapely.strtree import STRtree

_connect = sqlite3.connect
with tempfile.TemporaryDirectory() as _temp:
    with patch('sqlite3.connect', side_effect=lambda *a, **kw: _connect(_temp + '/test.db')):
        import main
        from pathfinder import ParetoRouteEngine, PolarPathfinder, NoRouteFoundError
        from route_geometry import LandMask, segment_clear, route_clear


class DemoRouteSafetyTests(unittest.TestCase):
    def setUp(self):
        self.network = patch('requests.get', side_effect=AssertionError('Tests must be offline'))
        self.network.start()
        self.preload = patch('data_engine.MetoceanEngine.preload_live_corridor', return_value=0)
        self.preload.start()

    def tearDown(self):
        self.preload.stop()
        self.network.stop()

    def test_real_coastline_covers_existing_geography(self):
        for point in [(-33.9249, 18.4241), (-77.846, 166.668), (-80, 0)]:
            self.assertTrue(LandMask.is_land(*point), point)
        self.assertFalse(LandMask.is_land(-60, 70))

    def test_island_between_clear_waypoints_blocks_segment(self):
        with patch.object(LandMask, '_tree', STRtree([box(70.9, -60.1, 71.1, -59.9)])):
            self.assertFalse(LandMask.is_land(-60, 70))
            self.assertFalse(LandMask.is_land(-60, 72))
            self.assertFalse(segment_clear((-60, 70), (-60, 72)))

    def test_touching_coastline_is_blocked(self):
        with patch.object(LandMask, '_tree', STRtree([box(71, -60, 72, -59)])):
            self.assertFalse(segment_clear((-60, 70), (-60, 73)))

    def test_iceberg_between_clear_waypoints_at_high_latitude(self):
        with patch.object(LandMask, '_tree', STRtree([])):
            hz = [{'lat': -78, 'lon': 165, 'radius_km': 15}]
            self.assertFalse(segment_clear((-78, 163), (-78, 167), hz))
            self.assertFalse(segment_clear((-78, 165), (-78, 165), hz))

    def test_date_line_obstacle_and_clear_crossing(self):
        with patch.object(LandMask, '_tree', STRtree([box(-180, -61, -179.5, -59)])):
            self.assertFalse(segment_clear((-60, 179), (-60, -179)))
            self.assertTrue(segment_clear((-62, 179), (-62, -179)))

    def test_blocked_grid_raises_no_route(self):
        with patch.object(LandMask, '_tree', STRtree([box(60, -70, 80, -50)])):
            with self.assertRaises(NoRouteFoundError):
                ParetoRouteEngine().compute_three_routes((-60, 70), (-60, 72), [])

    def test_real_graph_detours_around_simulated_island(self):
        obstacle = STRtree([box(70.9, -60.3, 71.1, -59.7)])
        with patch.object(LandMask, '_tree', obstacle):
            data = ParetoRouteEngine(grid_resolution_deg=0.4).compute_three_routes((-60, 70), (-60, 72), [])
            self.assertEqual(len(data['features']), 3)
            for f in data['features']:
                points = f['properties']['waypoints_latlon']
                self.assertEqual(points[0], [-60, 70])
                self.assertEqual(points[-1], [-60, 72])
                self.assertTrue(route_clear(points))
                self.assertTrue(any(abs(p[0] + 60) > .3 for p in points))

    def test_legacy_cannot_connect_a_land_endpoint(self):
        with patch.object(LandMask, '_tree', STRtree([box(69.9, -60.1, 70.1, -59.9)])):
            with self.assertRaises(NoRouteFoundError):
                PolarPathfinder().calculate_optimal_route((-60, 70), (-60, 72), [])

    def request(self):
        return main.get_pareto_routes(start_lat=-60, start_lon=70, end_lat=-61, end_lon=72,
            vessel_ice_class='PC3', cruising_speed_knots=14.5, grid_resolution_deg=.8,
            remaining_fuel_mt=450, fuel_tank_percentage=None, max_tank_capacity_mt=500)

    def test_compute_exception_is_503_without_geometry(self):
        with patch('main.fetch_live_usnic_icebergs', return_value=([], False, 'Demo', {})), \
             patch.object(ParetoRouteEngine, 'compute_three_routes', side_effect=RuntimeError('forced')):
            with self.assertRaises(main.HTTPException) as caught:
                self.request()
            self.assertEqual(caught.exception.status_code, 503)
            self.assertEqual(caught.exception.detail['code'], 'ROUTE_COMPUTE_FAILED')
            self.assertNotIn('features', caught.exception.detail)

    def test_no_path_is_409(self):
        with patch('main.fetch_live_usnic_icebergs', return_value=([], False, 'Demo', {})), \
             patch.object(ParetoRouteEngine, 'compute_three_routes', side_effect=NoRouteFoundError('blocked')):
            with self.assertRaises(main.HTTPException) as caught:
                self.request()
            self.assertEqual(caught.exception.status_code, 409)

    def test_land_endpoint_rejected_before_network_or_graph(self):
        with patch.object(LandMask, 'is_land', return_value=True), \
             patch('main.fetch_live_usnic_icebergs') as fetch, \
             patch.object(ParetoRouteEngine, 'compute_three_routes') as compute:
            with self.assertRaises(main.HTTPException) as caught:
                self.request()
            self.assertEqual(caught.exception.detail['code'], 'BLOCKED_ENDPOINT')
            fetch.assert_not_called()
            compute.assert_not_called()

    def test_missing_forecast_is_not_clear_water(self):
        with patch('main.fetch_live_usnic_icebergs', return_value=([], False, 'Demo', {})), \
             patch.object(main.DriftPhysicsEngine, 'get_all_forecasts', side_effect=RuntimeError('forced')):
            with self.assertRaises(main.HTTPException) as caught:
                self.request()
            self.assertEqual(caught.exception.detail['code'], 'HAZARDS_UNAVAILABLE')


if __name__ == '__main__':
    unittest.main()
