import requests
import json
import sys

BASE = 'http://localhost:8000'

def test_all():
    print("==================================================")
    print("1. HEALTH & OPERATIONAL SYNC STATUS")
    print("==================================================")
    r = requests.get(f'{BASE}/api/health')
    print('Status Code:', r.status_code)
    h = r.json()
    print('Header Text:', h.get('header_status_text'))
    print('Mode:', h.get('mode'))
    print('Is Live:', h.get('is_live_satellite'))
    print('Icebergs Ingested:', h.get('iceberg_count'))

    print("\n==================================================")
    print("2. 5 OFFICIAL POLAR GATEWAYS (PURGED CATALOG)")
    print("==================================================")
    r = requests.get(f'{BASE}/api/v1/destinations/gateways')
    print('Status Code:', r.status_code)
    gateways = r.json().get('gateways', [])
    print(f'Total Gateways: {len(gateways)}')
    for g in gateways:
        print(f"  [{g['code']}] {g['name']} ({g['lat']}, {g['lon']})")

    print("\n==================================================")
    print("3. OFFICIAL ANTARCTIC RESEARCH STATIONS")
    print("==================================================")
    r = requests.get(f'{BASE}/api/v1/destinations/stations')
    print('Status Code:', r.status_code)
    stations = r.json().get('stations', [])
    print(f'Total Stations: {len(stations)}')
    for s in stations:
        print(f"  [{s['id']}] {s['name']} ({s['lat']}, {s['lon']})")

    print("\n==================================================")
    print("4. SHIP AIS GPS FIX (IMO 9577133)")
    print("==================================================")
    r = requests.get(f'{BASE}/api/v1/vessel/last-fix?vessel_imo=9577133')
    print('Status Code:', r.status_code)
    print('Fix:', json.dumps(r.json().get('fix'), indent=2))

    print("\n==================================================")
    print("5. IN-VOYAGE ROUTE 1: GATEWAY (Cape Town -> Bharati)")
    print("==================================================")
    payload1 = {
        'origin_type': 'GATEWAY',
        'gateway_code': 'ZACPT',
        'destination_station_id': 'bharati_station',
        'vessel_ice_class': 'Polar Class 3 (PC3)',
        'cruising_speed_knots': 14.5,
        'remaining_fuel_mt': 200.0,
        'max_tank_capacity_mt': 200.0
    }
    r1 = requests.post(f'{BASE}/api/v1/calculate-route', json=payload1)
    print('Status Code:', r1.status_code)
    data1 = r1.json()
    print('Auto-switched:', data1.get('metadata', {}).get('auto_switched'))
    for f in data1.get('features', []):
        p = f['properties']
        print(f"  Route [{p['route_type']}]: dist={p['distance_nm']} NM, eta={p['eta_hours']}h, burn={p['total_fuel_burn_mt']} MT, feasibility={p['feasibility_status']}, flags={p['flags']}")

    print("\n==================================================")
    print("6. IN-VOYAGE ROUTE 2: SHIP GPS (Vasiliy Golovnin -> Bharati)")
    print("==================================================")
    payload2 = {
        'origin_type': 'CURRENT_SHIP_GPS',
        'origin_coords': [-64.50, 72.00],
        'destination_station_id': 'bharati_station',
        'vessel_ice_class': 'Polar Class 3 (PC3)',
        'cruising_speed_knots': 14.5,
        'remaining_fuel_mt': 100.0,
        'max_tank_capacity_mt': 200.0
    }
    r2 = requests.post(f'{BASE}/api/v1/calculate-route', json=payload2)
    print('Status Code:', r2.status_code)
    data2 = r2.json()
    for f in data2.get('features', []):
        p = f['properties']
        print(f"  Route [{p['route_type']}]: dist={p['distance_nm']} NM, eta={p['eta_hours']}h, burn={p['total_fuel_burn_mt']} MT, feasibility={p['feasibility_status']}, flags={p['flags']}")

    print("\n==================================================")
    print("7. IN-VOYAGE ROUTE 3: OCEAN MAP CLICK (Mid-Ocean -> Maitri)")
    print("==================================================")
    payload3 = {
        'origin_type': 'MID_OCEAN_COORDINATES',
        'origin_coords': [-58.00, 30.00],
        'destination_station_id': 'maitri_station',
        'vessel_ice_class': 'Polar Class 3 (PC3)',
        'cruising_speed_knots': 14.5,
        'remaining_fuel_mt': 150.0,
        'max_tank_capacity_mt': 200.0
    }
    r3 = requests.post(f'{BASE}/api/v1/calculate-route', json=payload3)
    print('Status Code:', r3.status_code)
    data3 = r3.json()
    for f in data3.get('features', []):
        p = f['properties']
        print(f"  Route [{p['route_type']}]: dist={p['distance_nm']} NM, eta={p['eta_hours']}h, burn={p['total_fuel_burn_mt']} MT, feasibility={p['feasibility_status']}, flags={p['flags']}")

if __name__ == '__main__':
    test_all()
