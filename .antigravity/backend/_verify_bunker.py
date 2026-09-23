import requests
import json

url = "http://localhost:8000/api/v1/calculate-route"

# Test 1: Full bunker (450 MT)
payload_feasible = {
    "start_lat": -33.9249,
    "start_lon": 18.4241,
    "end_lat": -69.4125,
    "end_lon": 76.1872,
    "remaining_fuel_mt": 450.0,
    "max_tank_capacity_mt": 500.0
}
r1 = requests.post(url, json=payload_feasible, timeout=15)
print("Test 1 Status Code:", r1.status_code)
d1 = r1.json()
print("Recommended:", d1["metadata"].get("recommended_route_type"), "Auto-switched:", d1["metadata"].get("auto_switched"))
for feat in d1["features"]:
    p = feat["properties"]
    print(f"  [{p['route_type']}] Burn: {p['total_fuel_burn_mt']} MT | Reserve: {p['mandatory_reserve_mt']} MT | Tank Left: {p['tank_left_percentage']}% [{p['feasibility_status']}]")

# Test 2: Low bunker (e.g. 100 MT) to trigger Safest UNREACHABLE and auto-switch to Balanced
# Find the lowest burn among the routes
safest_burn = next(f['properties']['total_fuel_burn_mt'] for f in d1['features'] if f['properties']['route_type'] == 'SAFEST')
balanced_burn = next(f['properties']['total_fuel_burn_mt'] for f in d1['features'] if f['properties']['route_type'] == 'BALANCED')
test_fuel = safest_burn - 10.0 # Just below Safest required burn

payload_low = {
    "start_lat": -33.9249,
    "start_lon": 18.4241,
    "end_lat": -69.4125,
    "end_lon": 76.1872,
    "remaining_fuel_mt": test_fuel,
    "max_tank_capacity_mt": 500.0
}
r2 = requests.post(url, json=payload_low, timeout=15)
print("\nTest 2 (Low Fuel = " + str(test_fuel) + " MT) Status Code:", r2.status_code)
d2 = r2.json()
print("Recommended:", d2["metadata"].get("recommended_route_type"))
print("Auto-switched:", d2["metadata"].get("auto_switched"))
print("Auto-switch Message:", d2["metadata"].get("auto_switched_message"))
for feat in d2["features"]:
    p = feat["properties"]
    print(f"  [{p['route_type']}] Burn: {p['total_fuel_burn_mt']} MT | Tank Left: {p['tank_left_percentage']}% [{p['feasibility_status']}] Flags: {p['flags']}")
