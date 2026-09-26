"""Bounded local route graph with full segment validation and documented estimates."""
from functools import lru_cache, wraps
from threading import RLock
from itertools import combinations
import math
import os
import networkx as nx
from shapely.geometry import LineString, Point, box
from shapely.affinity import translate
from shapely.ops import unary_union
from shapely.strtree import STRtree
from route_geometry import LandMask, _hazard_polygon, wrap_lon
from observed_data import DATASET_ID, GEOD, forecast, environment, vessel_class, CLASS_LIMITS
from route_objectives import OBJECTIVES, edge_metrics, search_profile, corridor_overlap

APPROACH_CHAINS = {
    'ZACPT':[(-34,18),(-36,17),(-58,17)],
    'USH':[(-55.5,-66),(-58,-66)],
    'CLPUQ':[(-52.6,-68.1),(-53,-67),(-53,-62),(-56,-62),(-58,-62)],
    'AUHBT':[(-43.2,147.6),(-44,148),(-58,148)],
    'NZLYT':[(-43.7,173.5),(-45,174),(-58,174)],
    'bharati_station':[(-69.2,76.2),(-68,76),(-58,76)],
    'maitri_station':[(-69.5,11.7),(-68,11.7),(-58,11.7)],
    'mcmurdo_station':[(-77.7,166),(-76,165),(-73,175),(-58,175)],
    'rothera_station':[(-67.7,-69),(-67.7,-70),(-62,-72),(-58,-72)],
}
PROFILES={'SAFEST':'#10b981','BALANCED':'#0ea5e9','FASTEST':'#f59e0b'}
ROUTING_MODEL='shared-constraints-objectives-v2'
_graph_lock=RLock()
ROUTE_CACHE_SIZE=max(1,min(36,int(os.getenv('ROUTE_CACHE_SIZE','36'))))

def single_build(function):
    @wraps(function)
    def guarded(*args,**kwargs):
        with _graph_lock: return function(*args,**kwargs)
    guarded.cache_clear=function.cache_clear
    guarded.cache_info=function.cache_info
    return guarded

class NoRouteFoundError(Exception): pass

def distance_nm(a,b):
    return GEOD.inv(a[1],a[0],b[1],b[0])[2]/1852

def samples(a,b):
    # Same longitude/latitude line drawn by the map, including antimeridian wrap.
    delta=wrap_lon(b[1]-a[1]); n=max(1,math.ceil(max(abs(b[0]-a[0]),abs(delta))/.15))
    return [(a[0]+(b[0]-a[0])*i/n,wrap_lon(a[1]+delta*i/n)) for i in range(n+1)]

class HazardIndex:
    def __init__(self,hours,buffer):
        shapes=[]
        for fc in forecast(hours,buffer):
            geom=hazard_geometry(fc)
            shapes.extend(translate(geom,xoff=shift) for shift in (-360,0,360))
        self.tree=STRtree(shapes)
    def blocked(self,a,b):
        lon=wrap_lon(a[1]); end=lon+wrap_lon(b[1]-a[1])
        return bool(len(self.tree.query(LineString([(lon,a[0]),(end,b[0])]),predicate='intersects')))

def hazard_geometry(fc):
    lon=fc['initial_lon']
    circles=[_hazard_polygon(p['lat'],lon+wrap_lon(p['lon']-lon),fc['safety_radius_km']) for p in fc['trajectory_points']]
    return unary_union(circles).convex_hull

def clear(a,b,hazards=None,ice_class='PC1'):
    if LandMask.segment_blocked(a,b): return False
    if hazards and hazards.blocked(a,b): return False
    return all(environment(*p)['sea_ice_concentration']<=CLASS_LIMITS[ice_class] for p in samples(a,b))

def edge_data(a,b):
    pts=samples(a,b)
    distances=[distance_nm(x,y) for x,y in zip(pts,pts[1:])]
    concentrations=[environment(*p)['sea_ice_concentration'] for p in pts]
    distance=sum(distances)
    mean=sum(d*(x+y)/2 for d,x,y in zip(distances,concentrations,concentrations[1:]))/max(distance,1e-12)
    return dict(distance_nm=distance,sic=max(concentrations),mean_sic=mean)

@single_build
@lru_cache(maxsize=1)
def passage_graph():
    nodes=set()
    for chain in APPROACH_CHAINS.values():
        for a,b in zip(chain,chain[1:]):
            steps=max(1,math.ceil(distance_nm(a,b)/70))
            nodes.update((round(a[0]+(b[0]-a[0])*i/steps,6),round(a[1]+(b[1]-a[1])*i/steps,6)) for i in range(steps+1))
    for lat in sorted(set(range(-35,-79,-3))|{-56,-58,-60,-62}):
        nodes.update((lat,lon) for lon in range(-180,180,5))
    # Alternate coastal approach nodes allow genuine obstacle detours.
    for key,chain in APPROACH_CHAINS.items():
        if '_station' in key:
            for lat,lon in chain:
                nodes.update((lat+dy,wrap_lon(lon+dx)) for dy in (0,1,2) for dx in (-4,-2,0,2,4))
    graph=nx.Graph()
    graph.add_nodes_from(p for p in sorted(nodes) if not LandMask.is_land(*p))
    indexed=[(p,Point(p[1]+offset,p[0])) for offset in (-360,0,360) for p in graph.nodes]
    tree=STRtree([geom for _,geom in indexed])
    checked=set()
    for a in graph.nodes:
        width=350/(60*max(.1,math.cos(math.radians(a[0]))))
        candidates={indexed[i][0] for i in tree.query(box(a[1]-width,a[0]-6,a[1]+width,a[0]+6))}
        nearest=sorted(((distance_nm(a,b),b) for b in candidates if b!=a),key=lambda item:(item[0],item[1]))[:16]
        for distance,b in nearest:
            pair=tuple(sorted((a,b)))
            if pair in checked: continue
            checked.add(pair)
            if distance<=350 and clear(a,b): graph.add_edge(a,b,**edge_data(a,b))
    return graph

@single_build
@lru_cache(maxsize=ROUTE_CACHE_SIZE)
def constraint_graph(hours,buffer,ice_class):
    hazards=HazardIndex(hours,buffer)
    graph=passage_graph().copy()
    for a,b,data in list(graph.edges(data=True)):
        if data['sic']>CLASS_LIMITS[ice_class] or hazards.blocked(a,b):
            graph.remove_edge(a,b)
    return graph,hazards

@single_build
@lru_cache(maxsize=ROUTE_CACHE_SIZE)
def profile_graph(hours,buffer,profile,ice_class):
    # Compatibility entry point: safety constraints are identical for all profiles.
    return constraint_graph(hours,buffer,ice_class)

def calculate(start,end,ice_class='PC3',speed=14.5,fuel=450,capacity=500,hours=72,buffer=25,burn_rate=12,reserve_pct=15):
    code=vessel_class(ice_class)
    for p in (start,end):
        if LandMask.is_land(*p): raise NoRouteFoundError('Endpoint intersects mapped land or ice shelf. Select an offshore approach.')
        if environment(*p)['sea_ice_concentration']>CLASS_LIMITS[code]:
            raise NoRouteFoundError(f'{code} exceeds its planning-model sea-ice limit ({CLASS_LIMITS[code]*100:g}%). Choose another vessel class or endpoint.')
    base,hazards=constraint_graph(hours,buffer,code)
    graph=base.copy()
    for p in (start,end):
        if p not in graph:
            candidates=sorted(graph.nodes,key=lambda q:distance_nm(p,q))[:36]
            graph.add_node(p)
            for q in candidates:
                if distance_nm(p,q)<=650 and clear(p,q,hazards,code):
                    graph.add_edge(p,q,**edge_data(p,q))
    if distance_nm(start,end)<=650 and clear(start,end,hazards,code):
        graph.add_edge(start,end,**edge_data(start,end))
    directed=nx.DiGraph()
    directed.add_nodes_from(graph.nodes)
    for a,b,data in graph.edges(data=True):
        for x,y in ((a,b),(b,a)):
            metrics=edge_metrics(x,y,data,speed,burn_rate)
            directed.add_edge(x,y,**data,**metrics,balanced_cost=metrics['eta_hours']+4*metrics['ice_exposure_hours'])
    features=[]
    for profile,color in PROFILES.items():
        try: points=search_profile(directed,start,end,profile)
        except (nx.NetworkXNoPath,nx.NodeNotFound): continue
        if len(points)<2 or not all(clear(a,b,hazards,code) for a,b in zip(points,points[1:])):
            raise NoRouteFoundError('Final segment validation failed.')
        distance=eta=burn=exposure=ice_hours=0.; max_sic=0.
        commanded_speed=speed
        for a,b in zip(points,points[1:]):
            edge=directed[a][b]; d=edge['distance_nm']
            distance+=d; eta+=edge['eta_hours']; burn+=edge['fuel_mt']
            exposure+=d*edge['mean_sic']; max_sic=max(max_sic,edge['sic'])
            ice_hours+=edge['ice_exposure_hours']
        reserve=capacity*reserve_pct/100
        feasible=burn+reserve<=fuel
        continuous=[list(points[0])]
        for lat,lon in points[1:]: continuous.append([lat,continuous[-1][1]+wrap_lon(lon-continuous[-1][1])])
        risk=100*exposure/max(distance,1)
        props=dict(route_type=profile,color=color,label=profile.title(),distance_nm=round(distance,2),eta_hours=round(eta,2),
                   total_fuel_burn_mt=round(burn,3),fuel_remaining_mt=round(fuel-burn,3),reserve_mt=reserve,
                   tank_remaining_percentage=round(100*(fuel-burn)/capacity,1),feasibility_status='FEASIBLE' if feasible else 'UNREACHABLE',
                   risk_score=round(risk,2),risk_rating='Estimated ice exposure',max_ice_concentration=round(max_sic*100,1),
                   daily_burn_mt=round(burn/eta*24,3),commanded_speed_knots=commanded_speed,
                   geometry_validated=True,routing_algorithm='Lexicographic Dijkstra' if profile=='SAFEST' else 'A* (zero heuristic)',
                   objective=OBJECTIVES[profile],ice_exposure_hours=round(ice_hours,3),
                   objective_value=[ice_hours,eta] if profile=='SAFEST' else (eta if profile=='FASTEST' else eta+4*ice_hours),
                   waypoints_latlon=continuous,flags=[],forecast_hours=hours,
                   forecast_covers_voyage=eta<=hours,uncovered_voyage_hours=round(max(0,eta-hours),1),
                   iceberg_hazard_buffer_km=buffer,validation_scope='Natural Earth land, USNIC 2022 shelf, report-based estimated swept iceberg envelopes',
                   data_source=DATASET_ID,fuel_savings_pct=None,min_polaris_rio=None)
        baseline_points=samples(start,end)
        baseline_distance=baseline_time=baseline_burn=0.
        for a,b in zip(baseline_points,baseline_points[1:]):
            d=distance_nm(a,b); env=environment((a[0]+b[0])/2,wrap_lon(a[1]+wrap_lon(b[1]-a[1])/2))
            sic=max(environment(*a)['sea_ice_concentration'],environment(*b)['sea_ice_concentration'])
            heading=GEOD.inv(a[1],a[0],b[1],b[0])[0]
            v=max(2,commanded_speed*(1-.5*sic)*(1-.002*env['wind_knots'])+env['current_knots']*math.cos(math.radians(heading-90)))
            t=d/v; baseline_distance+=d; baseline_time+=t
            baseline_burn+=burn_rate*(commanded_speed/12)**3*(1+.5*sic)*t/24
        props.update(direct_distance_nm=round(baseline_distance,2),direct_estimated_voyage_hours=round(baseline_time,2),
                     direct_fuel_consumption_tons=round(baseline_burn,3),baseline_is_navigable=clear(start,end,hazards,code),
                     fuel_savings_pct=round(100*(baseline_burn-burn)/baseline_burn,2) if baseline_burn else None)
        features.append(dict(type='Feature',geometry=dict(type='LineString',coordinates=[[lo,la] for la,lo in continuous]),properties=props))
    if not features: raise NoRouteFoundError('No safe route available in the search network for these obstacles and vessel settings.')
    overlaps=[]
    for f in features: f['properties']['shared_corridor_with']=[]
    for first,second in combinations(features,2):
        a,b=first['properties'],second['properties']
        overlap=corridor_overlap(a['waypoints_latlon'],b['waypoints_latlon'])
        overlaps.append(dict(profiles=[a['route_type'],b['route_type']],overlap_percent=round(overlap,1)))
        if overlap>=90:
            a['shared_corridor_with'].append(b['route_type'])
            b['shared_corridor_with'].append(a['route_type'])
    feasible=[f for f in features if f['properties']['feasibility_status']=='FEASIBLE']
    recommended=min(feasible,key=lambda f:(f['properties']['ice_exposure_hours'],f['properties']['eta_hours'])) if feasible else None
    return dict(type='FeatureCollection',features=features,metadata=dict(dataset_id=DATASET_ID,observation_date='2026-09-24',
        source='Reported observations with calculated planning estimates',recommended_route_type=recommended['properties']['route_type'] if recommended else None,
        recommendation_reason='Lowest cumulative estimated ice exposure among fuel-feasible routes' if recommended else 'No route meets fuel plus reserve requirement',
        routing_model=ROUTING_MODEL,profile_overlap=overlaps,overlap_tolerance_km=10,shared_corridor_threshold_percent=90,
        comparison_note='All profiles use the same speed, vessel and safety buffer. Shared sections are not offset or forced apart.',
        origin=dict(lat=start[0],lon=start[1]),destination=dict(lat=end[0],lon=end[1]),forecast_hours=hours,safety_buffer_km=buffer,
        unavailable_profiles=[p for p in PROFILES if p not in {f['properties']['route_type'] for f in features}],
        fuel_model=dict(reference_burn_mt_day=burn_rate,reference_speed_knots=12,reserve_percent=reserve_pct),
        approach_note='Offshore planning endpoints; harbour and shore-transfer legs are not modelled.'))
