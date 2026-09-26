"""Current runtime regression suite. Run: python -m unittest test_observation_demo -v."""
import json
import tempfile
import unittest
import networkx as nx
from pathlib import Path
from unittest.mock import patch
from fastapi.testclient import TestClient
from shapely.geometry import Point, box
from shapely.strtree import STRtree
import main
from observed_data import SNAPSHOT, DATASET_ID, forecast, environment
from observed_routes import APPROACH_CHAINS, CLASS_LIMITS, profile_graph, clear, hazard_geometry
from route_geometry import LandMask
from concurrent.futures import ThreadPoolExecutor

class ObservationDemoTests(unittest.TestCase):
    def test_astar_matches_dijkstra_cost(self):
        astar=nx.astar_path
        def checked_search(graph,start,end,**kwargs):
            points=astar(graph,start,end,**kwargs)
            actual=nx.path_weight(graph,points,kwargs['weight'])
            expected=nx.dijkstra_path_length(graph,start,end,weight=kwargs['weight'])
            self.assertAlmostEqual(actual,expected,places=6)
            return points
        with patch('route_objectives.nx.astar_path',side_effect=checked_search) as search:
            response=self.route()
        self.assertEqual(response.status_code,200)
        self.assertEqual(search.call_count,2)
        result=response.json()
        for feature in result['features']:
            p=feature['properties']
            self.assertIn('Dijkstra' if p['route_type']=='SAFEST' else 'A*',p['routing_algorithm'])

    @classmethod
    def setUpClass(cls):
        cls.client=TestClient(main.app)
        cls.network=patch('socket.create_connection',side_effect=AssertionError('Runtime attempted outbound network'))
        cls.network.start()
    @classmethod
    def tearDownClass(cls): cls.network.stop()
    def route(self,**params): return self.client.post('/api/v1/calculate-route',json=params)

    def test_all_twenty_presets_and_every_segment(self):
        for gateway in main.LOCATIONS['POLAR_GATEWAYS']:
            for station in main.LOCATIONS['ANTARCTIC_STATIONS']:
                response=self.route(gateway_code=gateway,destination_station_id=station)
                self.assertEqual(response.status_code,200,response.text)
                result=response.json(); self.assertEqual(result['metadata']['dataset_id'],DATASET_ID)
                self.assertEqual(len(result['features']),3)
                profiles={f['properties']['route_type']:f['properties'] for f in result['features']}
                self.assertEqual({p['commanded_speed_knots'] for p in profiles.values()},{14.5})
                self.assertEqual({p['iceberg_hazard_buffer_km'] for p in profiles.values()},{25})
                for p in profiles.values():
                    self.assertLessEqual(profiles['FASTEST']['eta_hours'],p['eta_hours']+.01)
                    self.assertLessEqual(profiles['SAFEST']['ice_exposure_hours'],p['ice_exposure_hours']+.001)
                    self.assertLessEqual(profiles['BALANCED']['objective_value'],p['eta_hours']+4*p['ice_exposure_hours']+.02)
                for feature in result['features']:
                    p=feature['properties']; _,hazards=profile_graph(72,25,p['route_type'],'PC3')
                    points=p['waypoints_latlon']
                    self.assertTrue(all(clear(a,b,hazards,'PC3') for a,b in zip(points,points[1:])))
                    self.assertTrue(p['geometry_validated']); self.assertGreater(p['distance_nm'],0)

    def test_snapshot_and_selected_details_are_small_and_consistent(self):
        data=self.client.get('/api/v1/icebergs').json()
        self.assertEqual(len(data['icebergs_present']),33)
        self.assertLess(len(json.dumps(data)),50000)
        self.assertEqual(data['icebergs_present'],SNAPSHOT['icebergs'])
        self.assertNotIn('trajectory_points',data['icebergs_predicted_72h'][0])
        detail=self.client.get('/api/v1/icebergs/D15A/trajectory').json()
        self.assertEqual(detail['dataset_id'],DATASET_ID)
        geom=hazard_geometry(next(f for f in forecast() if f['id']=='D15A'))
        self.assertTrue(geom.contains(Point(detail['initial_lon'],detail['initial_lat'])))
        self.assertTrue(geom.contains(Point(detail['lon'],detail['lat'])))

    def test_controls_modify_estimates_and_constraints(self):
        a=self.route(forecast_hours=0,safety_buffer_km=5).json()
        b=self.route(forecast_hours=72,safety_buffer_km=25).json()
        self.assertNotEqual(a['metadata']['request_id'],b['metadata']['request_id'])
        self.assertGreater(forecast(168,50)[0]['safety_radius_km'],forecast(0,5)[0]['safety_radius_km'])
        blocked=self.route(forecast_hours=168,safety_buffer_km=50)
        self.assertEqual(blocked.status_code,409,blocked.text)
        slow=self.route(cruising_speed_knots=10).json()['features'][0]['properties']
        fast=self.route(cruising_speed_knots=20).json()['features'][0]['properties']
        self.assertGreater(slow['eta_hours'],fast['eta_hours'])
        self.assertLess(slow['total_fuel_burn_mt'],fast['total_fuel_burn_mt'])
        normal=self.route().json()['features'][0]['properties']
        double=self.route(reference_burn_mt_day=24).json()['features'][0]['properties']
        self.assertAlmostEqual(double['total_fuel_burn_mt'],2*normal['total_fuel_burn_mt'],delta=.002)

    def test_fuel_recommendations_respect_reserve_and_zero(self):
        result=self.route(remaining_fuel_mt=0).json()
        self.assertIsNone(result['metadata']['recommended_route_type'])
        self.assertTrue(all(f['properties']['feasibility_status']=='UNREACHABLE' for f in result['features']))
        result=self.route().json(); recommendation=result['metadata']['recommended_route_type']
        p=next(f['properties'] for f in result['features'] if f['properties']['route_type']==recommendation)
        self.assertLessEqual(p['total_fuel_burn_mt']+p['reserve_mt'],450)
        self.assertEqual(self.route(remaining_fuel_mt=501).status_code,422)

    def test_vessel_restriction_changes_availability(self):
        self.assertEqual(self.route(destination_station_id='mcmurdo_station',vessel_ice_class='PC3').status_code,200)
        response=self.route(destination_station_id='mcmurdo_station',vessel_ice_class='PC5')
        self.assertEqual(response.status_code,409)
        self.assertIn('planning-model sea-ice limit',response.text)
        self.assertEqual(self.route(vessel_ice_class='Open Water Vessel').status_code,409)

    def test_failures_never_return_a_fallback(self):
        response=self.route(start_lat=-80,start_lon=0)
        self.assertEqual(response.status_code,409)
        self.assertNotIn('features',response.json())
        with patch('main.calculate',side_effect=main.NoRouteFoundError('Blocked')):
            self.assertEqual(self.route().status_code,409)
        with patch('main.calculate',side_effect=OSError('Missing source')):
            self.assertEqual(self.route().status_code,503)
        self.assertEqual(self.route(gateway_code='FAKE').status_code,422)
        self.assertEqual(self.route(origin_coords=[-90,500]).status_code,422)
        self.assertEqual(self.route(vessel_ice_class='FAKE').status_code,422)

    def test_between_waypoint_collision_and_dateline(self):
        with patch.object(LandMask,'_tree',STRtree([box(10.9,-50.1,11.1,-49.9)])):
            self.assertFalse(clear((-50,10),(-50,12)))
        result=self.route(start_lat=-58,start_lon=179,end_lat=-58,end_lon=-179,forecast_hours=0,safety_buffer_km=5)
        self.assertEqual(result.status_code,200,result.text)
        self.assertLess(result.json()['features'][0]['properties']['distance_nm'],100)

    def test_endpoints_inside_observed_iceberg_fail(self):
        ib=SNAPSHOT['icebergs'][0]
        response=self.route(start_lat=ib['lat'],start_lon=ib['lon'])
        self.assertEqual(response.status_code,409,response.text)

    def test_custom_coordinates_and_fix_persistence(self):
        with tempfile.TemporaryDirectory() as folder, patch.object(main,'FIX_PATH',Path(folder)/'fixes.json'):
            self.client.post('/api/v1/vessel/update-fix',json=dict(lat=-50,lon=10))
            self.assertEqual(self.client.get('/api/v1/vessel/last-fix').json()['fix']['lat'],-50)
            self.route()
            self.assertEqual(self.client.get('/api/v1/vessel/last-fix').json()['fix']['lat'],-50)
            response=self.route(origin_type='MID_OCEAN_COORDINATES',origin_coords=[-50,10],end_lat=-51,end_lon=12)
            self.assertEqual(response.status_code,200,response.text)

    def test_layer_data_not_reported_live(self):
        self.assertFalse(self.client.get('/api/health').json()['is_live_satellite'])
        for name in ['usnic-icebergs','byu-icebergs','sea-ice','sar-candidates','ocean-currents','weather-wind']:
            response=self.client.get('/api/v1/layers/'+name)
            self.assertEqual(response.status_code,200)
            self.assertFalse(response.json()['is_live'])
        self.assertEqual(self.client.get('/api/v1/map-base').status_code,200)

    def test_concurrent_graph_requests_build_once(self):
        from observed_routes import profile_graph
        before=profile_graph.cache_info().misses
        with ThreadPoolExecutor(max_workers=4) as pool:
            results=list(pool.map(lambda _:profile_graph(25,17,'BALANCED','PC3'),range(4)))
        self.assertEqual(profile_graph.cache_info().misses-before,1)
        self.assertTrue(all(result[0] is results[0][0] for result in results))

if __name__=='__main__': unittest.main()
