"""All preset selections must return local, obstacle-validated demo passages."""
import unittest
from unittest.mock import patch
from test_demo_route_safety import main
from demo_passages import APPROACH_CHAINS, profile_graph
from route_geometry import route_clear


class PresetTests(unittest.TestCase):
    def test_all_twenty_preset_pairs_offline(self):
        with patch('requests.get', side_effect=AssertionError('Preset demo must be offline')):
            for gateway in main.POLAR_GATEWAYS:
                for station in main.ANTARCTIC_STATIONS:
                    with self.subTest(gateway=gateway, station=station):
                        result = main.post_calculate_route(main.CalculateRouteRequest(
                            gateway_code=gateway, destination_station_id=station, safety_buffer_km=25))
                        self.assertEqual(len(result['features']), 3)
                        self.assertTrue(result['metadata']['offshore_approaches'])
                        for feature in result['features']:
                            props = feature['properties']
                            points = props['waypoints_latlon']
                            self.assertEqual(points[0], list(APPROACH_CHAINS[gateway][0]))
                            hazards = profile_graph(props['route_type'], 72, 25)[1]
                            self.assertTrue(route_clear(points, hazards))

    def test_old_frontend_exact_facility_overrides_are_resolved(self):
        with patch('requests.get', side_effect=AssertionError('Preset demo must be offline')):
            result = main.post_calculate_route(main.CalculateRouteRequest(
                start_lat=-33.9249, start_lon=18.4241, end_lat=-69.4125, end_lon=76.1872))
            self.assertEqual(len(result['features']), 3)
            self.assertEqual(result['metadata']['origin']['lat'], -34)
