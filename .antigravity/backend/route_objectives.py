"""Planning objectives and comparisons; all profiles use the same physical model."""
import heapq
import math
from itertools import count
import networkx as nx
from observed_data import GEOD, environment
from route_geometry import wrap_lon

OBJECTIVES = {
    'SAFEST': 'Minimum cumulative estimated ice exposure; shortest time breaks ties',
    'BALANCED': 'Travel hours + 4 × ice-exposure hours',
    'FASTEST': 'Minimum estimated travel time',
}

def edge_metrics(a, b, edge, speed, burn_rate=12):
    sic = edge.get('mean_sic', edge['sic'])
    env = environment((a[0]+b[0])/2, wrap_lon(a[1]+wrap_lon(b[1]-a[1])/2))
    heading = GEOD.inv(a[1], a[0], b[1], b[0])[0]
    current = env['current_knots'] * math.cos(math.radians(heading-90))
    velocity = max(2, speed*(1-.5*sic)*(1-.002*env['wind_knots'])+current)
    hours = edge['distance_nm']/velocity
    return dict(eta_hours=hours, ice_exposure_hours=hours*sic,
                fuel_mt=burn_rate*(speed/12)**3*(1+.5*sic)*hours/24)

def search_profile(graph, start, end, profile):
    """Directed edges carry time/exposure. Safest uses exact lexicographic costs."""
    if start not in graph or end not in graph:
        raise nx.NodeNotFound('Endpoint absent from graph')
    if profile != 'SAFEST':
        weight = 'eta_hours' if profile == 'FASTEST' else 'balanced_cost'
        # Zero heuristic is admissible for both objectives and avoids assumptions
        # about current-assisted speed. NetworkX A* then behaves as Dijkstra.
        return nx.astar_path(graph, start, end, heuristic=lambda a,b: 0, weight=weight)
    queue = [(0., 0., 0, start)]
    serial = count(1)
    costs = {start: (0., 0.)}
    parents = {}
    while queue:
        ice, hours, _, node = heapq.heappop(queue)
        if (ice, hours) != costs[node]:
            continue
        if node == end:
            path = [end]
            while path[-1] != start:
                path.append(parents[path[-1]])
            return path[::-1]
        for nxt, edge in graph[node].items():
            cost = (ice+edge['ice_exposure_hours'], hours+edge['eta_hours'])
            if cost < costs.get(nxt, (math.inf, math.inf)):
                costs[nxt] = cost
                parents[nxt] = node
                heapq.heappush(queue, (*cost, next(serial), nxt))
    raise nx.NetworkXNoPath('No connected safe passage')

def distance_to_segment_km(point, a, b):
    """Local projection locates the nearest point; WGS84 measures its distance."""
    scale = max(.01, math.cos(math.radians(point[0])))
    ax = wrap_lon(a[1]-point[1])*scale
    ay = a[0]-point[0]
    bx = ax+wrap_lon(b[1]-a[1])*scale
    by = b[0]-point[0]
    dx, dy = bx-ax, by-ay
    t = max(0, min(1, -(ax*dx+ay*dy)/(dx*dx+dy*dy))) if dx*dx+dy*dy else 0
    near = (point[0]+ay+t*dy, point[1]+(ax+t*dx)/scale)
    return GEOD.inv(point[1],point[0],near[1],near[0])[2]/1000

def corridor_overlap(first, second, tolerance_km=10):
    """Length-weighted sampling every <=10 km; comparison never modifies geometry."""
    def fraction(path, other):
        total = matching = 0.
        for a,b in zip(path,path[1:]):
            length = GEOD.inv(a[1],a[0],b[1],b[0])[2]/1000
            steps = max(1, math.ceil(length/10))
            for i in range(steps):
                t = (i+.5)/steps
                p = (a[0]+(b[0]-a[0])*t, a[1]+wrap_lon(b[1]-a[1])*t)
                total += length/steps
                # A latitude difference of one degree exceeds 110 km everywhere.
                # Reject remote segments before their geodesic distance calculation.
                padding=tolerance_km/110
                if any(min(x[0],y[0])-padding<=p[0]<=max(x[0],y[0])+padding
                       and distance_to_segment_km(p,x,y)<=tolerance_km
                       for x,y in zip(other,other[1:])):
                    matching += length/steps
        return matching/total if total else 1.
    return 100*min(fraction(first,second), fraction(second,first))
