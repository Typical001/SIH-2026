import requests
import json

BASE = 'http://localhost:8000'

def test_bunker_gating():
    print("\n==================================================")
    print("8. BUNKER FEASIBILITY GATING & AUTO-SWITCH")
    print("==================================================")
    payload = {
        'origin_type': 'GATEWAY',
        'gateway_code': 'ZACPT',
        'destination_station_id': 'bharati_station',
        'vessel_ice_class': 'Polar Class 3 (PC3)',
        'cruising_speed_knots': 14.5,
        'remaining_fuel_mt': 110.0,
        'max_tank_capacity_mt': 200.0
    }
    r = requests.post(f'{BASE}/api/v1/calculate-route', json=payload)
    data = r.json()
    print('Auto-switched:', data.get('metadata', {}).get('auto_switched'))
    print('Recommended Route Type:', data.get('metadata', {}).get('recommended_route_type'))
    for f in data.get('features', []):
        p = f['properties']
        print(f"  Route [{p['route_type']}]: Burn={p['total_fuel_burn_mt']} MT | Status={p['feasibility_status']}")

def test_circuit_breaker():
    print("\n==================================================")
    print("9. TIER 2 CIRCUIT BREAKER (GEOMETRIC TANGENT FALLBACK)")
    print("==================================================")
    # Direct test calling pathfinder's geometric_tangent_fallback directly
    from pathfinder import geometric_tangent_fallback
    from shapely.geometry import Polygon
    start = (-65.0, 70.0)
    end = (-69.4, 76.0)
    haz = Polygon([
        (71.0, -66.5),
        (74.0, -66.5),
        (74.0, -68.0),
        (71.0, -68.0),
        (71.0, -66.5)
    ])
    waypoints = geometric_tangent_fallback(start, end, [haz])
    flags = ["GEOMETRIC_SAFETY_CORRIDOR_FALLBACK"]
    print(f"Tangential fallback returned {len(waypoints)} waypoints")
    print(f"Flags emitted: {flags}")
    print(f"Waypoints: {waypoints[:3]} ... {waypoints[-2:]}")

if __name__ == '__main__':
    test_bunker_gating()
    test_circuit_breaker()
