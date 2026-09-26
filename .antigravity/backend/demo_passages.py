"""Offline preset demo passages; illustrative offshore points, not harbour routes."""
from functools import lru_cache
from itertools import combinations
import math
import networkx as nx
from route_geometry import segment_clear, route_clear, wrap_lon
from pathfinder import haversine_nm, _prepare_hazard_polys, _route_metrics, NoRouteFoundError
from data_engine import MetoceanEngine, get_initial_icebergs
from drift_engine import DriftPhysicsEngine

APPROACH_CHAINS = {
    'ZACPT': [(-34,18),(-36,17),(-58,17)],
    'USH': [(-55.5,-66),(-58,-66)],
    'CLPUQ': [(-52.6,-68.1),(-53,-67),(-53,-62),(-56,-62),(-58,-62)],
    'AUHBT': [(-43.2,147.6),(-44,148),(-58,148)],
    'NZLYT': [(-43.7,173.5),(-45,174),(-58,174)],
    'bharati_station': [(-69.2,76.2),(-68,76),(-58,76)],
    'maitri_station': [(-69.5,11.7),(-68,11.7),(-58,11.7)],
    'mcmurdo_station': [(-77.7,166),(-76,165),(-73,175),(-58,175)],
    'rothera_station': [(-67.7,-69),(-67.7,-70),(-62,-72),(-58,-72)],
}


@lru_cache(maxsize=1)
def passage_graph():
    nodes = set()
    for chain in APPROACH_CHAINS.values():
        for a, b in zip(chain, chain[1:]):
            steps = max(1, math.ceil(haversine_nm(*a, *b) / 90))
            for i in range(steps + 1):
                nodes.add((round(a[0] + (b[0]-a[0])*i/steps, 6),
                           round(a[1] + (b[1]-a[1])*i/steps, 6)))
    for lat in (-58, -60):
        nodes.update((lat, lon) for lon in range(-180, 180, 5))
    graph = nx.Graph()
    graph.add_nodes_from(nodes)
    for a, b in combinations(sorted(nodes), 2):
        distance = haversine_nm(*a, *b)
        if distance <= 350 and segment_clear(a, b):
            graph.add_edge(a, b, distance_nm=distance)
    return graph


@lru_cache(maxsize=24)
def profile_graph(profile, hours, buffer):
    forecasts = DriftPhysicsEngine.get_all_forecasts(get_initial_icebergs(), hours, buffer)
    penalty = {'SAFEST':35,'BALANCED':15,'FASTEST':5}[profile]
    hazards = _prepare_hazard_polys(forecasts, buffer + (10 if profile == 'SAFEST' else 0))
    graph = passage_graph().copy()
    for a, b, data in list(graph.edges(data=True)):
        if not segment_clear(a, b, hazards):
            graph.remove_edge(a, b)
            continue
        midlon = a[1] + wrap_lon(b[1]-a[1])/2
        sic = MetoceanEngine.get_sea_ice_concentration((a[0]+b[0])/2, wrap_lon(midlon))
        data['weight'] = data['distance_nm'] * (1 + penalty*sic)
    return graph, hazards


def calculate_preset(gateway, station, ice_class, speed, fuel, capacity, hours=72, buffer=20):
    start, end = APPROACH_CHAINS[gateway][0], APPROACH_CHAINS[station][0]
    features = []
    for profile, color, penalty in [('SAFEST','#10b981',35),('BALANCED','#0ea5e9',15),('FASTEST','#f59e0b',5)]:
        graph, hazards = profile_graph(profile, hours, buffer)
        try:
            points = nx.shortest_path(graph, start, end, weight='weight')
        except nx.NetworkXNoPath:
            continue
        continuous = [list(points[0])]
        for lat, lon in points[1:]:
            continuous.append([lat, continuous[-1][1] + wrap_lon(lon-continuous[-1][1])])
        if not route_clear(continuous, hazards):
            raise NoRouteFoundError('Demo passage validation failed.')
        metrics = _route_metrics(continuous, hazards, ice_class, speed, fuel, capacity, profile)
        features.append({'type':'Feature', 'geometry':{'type':'LineString','coordinates':[[lo,la] for la,lo in continuous]},
            'properties':{'route_type':profile,'color':color,'label':profile.title(),**metrics,
                'waypoints_latlon':continuous,'geometry_validated':True,'flags':[],
                'data_source':'Simulated demo','validation_scope':'Bundled land and simulated iceberg forecast buffers'}})
    if not features:
        raise NoRouteFoundError('No clear passage in this demo scenario.')
    feasible = [f for f in features if f['properties']['feasibility_status'] != 'UNREACHABLE']
    return {'type':'FeatureCollection','features':features,'metadata':{
        'data_source':'Simulated demo','algorithm':'Validated demo passage network',
        'recommended_route_type':feasible[0]['properties']['route_type'] if feasible else None,
        'auto_switched':False, 'forecast_hours':hours,'safety_buffer_km':buffer,
        'origin':{'lat':start[0],'lon':start[1]},'destination':{'lat':end[0],'lon':end[1]},
        'offshore_approaches':True, 'approach_note':'Illustrative offshore endpoints; harbour and shore transfer legs are not modelled.'}}
