from data_engine import fetch_live_usnic_icebergs, MetoceanEngine
from drift_engine import DriftPhysicsEngine
from pathfinder import ParetoRouteEngine
import time

print('Testing live iceberg fetch...')
t0 = time.time()
icebergs, is_live, src, _ = fetch_live_usnic_icebergs()
print(f'Fetched {len(icebergs)} icebergs, is_live={is_live}, src={src} in {time.time()-t0:.2f}s')

print('Testing ParetoRouteEngine 3 routes...')
t0 = time.time()
engine = ParetoRouteEngine()
res = engine.compute_three_routes(
    start_coord=(-33.9249, 18.4241),
    end_coord=(-69.4125, 76.1872),
    iceberg_forecasts=[],
    data_source_label='Test Live'
)
print(f'Done in {time.time()-t0:.2f}s!')
print(f'Type: {res["type"]}, Features: {len(res["features"])}')
for f in res['features']:
    p = f['properties']
    print(f'  [{p["route_type"]}] Dist: {p["distance_nm"]} NM, ETA: {p["eta_hours"]}h, RIO: {p["min_polaris_rio"]}, Flags: {p["flags"]}')
