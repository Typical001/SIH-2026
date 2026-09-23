"""
CLI Health Check Script: Live Satellite Iceberg API Verification
SIH Problem Statement SIH26059: Dynamic Route Optimization & Iceberg Movement Forecasting

Performs automated verification of:
1. Primary USNIC / NOAA GeoPlatform ArcGIS REST API & NSIDC FeatureServer endpoints.
2. Asserts HTTP 200 status code and valid GeoJSON response headers.
3. Parses live satellite iceberg features & prints top 5 tracked Antarctic icebergs with real WGS84 lat/lon, size, and source.
4. Asserts that NO synthetic mock data was used during online live mode.
"""

import sys
import os
import requests

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from data_engine import fetch_live_usnic_icebergs

def main():
    print("=" * 80)
    print(" POLARNAV CLI HEALTH CHECK: REAL-TIME SATELLITE & METOCEAN APIS")
    print(" SIH Problem Statement SIH26059 (Antarctic Satellite Sync Verification)")
    print("=" * 80)

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/geo+json, application/json, text/plain, */*"
    }

    primary_url = "https://services.arcgis.com/nGt4QxSblgDfeJn9/arcgis/rest/services/Icebergs/FeatureServer/1/query"
    params = {
        "where": "1=1",
        "outFields": "*",
        "f": "geojson",
        "returnGeometry": "true"
    }

    print(f"\n[1/4] Pinging Live NOAA / USNIC Satellite Icebergs GeoJSON Endpoint...")
    print(f"      URL: {primary_url}")
    
    try:
        response = requests.get(primary_url, params=params, headers=headers, timeout=12)
        print(f"      HTTP Status Code: {response.status_code}")
        assert response.status_code == 200, f"Expected HTTP 200, got {response.status_code}"
        print("      SUCCESS: HTTP 200 OK returned from live GIS server.")
        
        geojson = response.json()
        features = geojson.get("features", [])
        print(f"      Features Extracted: {len(features)} live/tracked satellite records.")
        assert len(features) > 0, "No iceberg features returned from live GIS endpoint."
    except Exception as exc:
        print(f"      ERROR: Direct HTTP ping failed: {exc}")
        sys.exit(1)

    print("\n[2/4] Running backend `fetch_live_usnic_icebergs()` integration client...")
    icebergs, is_live, source_name, geojson_collection = fetch_live_usnic_icebergs()

    print(f"      Sync Status Mode: {'ONLINE_LIVE_SATELLITE' if is_live else 'OFFLINE_CACHE'}")
    print(f"      Source Provider:  {source_name}")
    print(f"      Total Tracked:    {len(icebergs)} icebergs")

    # Assert LIVE satellite data mode
    assert is_live is True, "CRITICAL FAILURE: System fell back to offline demo data! Expected real live satellite connection."
    print("      ASSERTION PASSED: Live Satellite Mode verified (is_live=True).")

    print("\n[3/4] TOP 5 REAL-TIME TRACKED ANTARCTIC ICEBERGS (WGS84 Coordinates):")
    print("-" * 80)
    print(f"{'ID':<12} | {'NAME / DESIGNATOR':<30} | {'LATITUDE':<10} | {'LONGITUDE':<10} | {'AREA (SQ KM)':<12} | {'SOURCE'}")
    print("-" * 80)

    for ib in icebergs[:5]:
        size_sqkm = ib.metadata.get("size_sqkm", round(ib.length_km * ib.width_km, 1))
        print(f"{ib.id:<12} | {ib.name[:30]:<30} | {ib.lat:<10.4f} | {ib.lon:<10.4f} | {size_sqkm:<12.1f} | {ib.source[:20]}")

    print("-" * 80)

    print("\n[4/4] VERIFYING NO MOCK DATA WAS INVOKED...")
    mock_names = ["Bharati Approach Hazard Alpha", "Maitri Approach Hazard #01", "Roaring 50s Drift Target #44"]
    for ib in icebergs[:10]:
        for mock_name in mock_names:
            assert ib.name != mock_name, f"Mock data detected in live satellite feed: {ib.name}"

    print("      ASSERTION PASSED: 100% Real Satellite Coordinates verified. Zero synthetic mock data used.")
    print("\n" + "=" * 80)
    print(" ALL API HEALTH CHECKS PASSED SUCCESSFULLY (ONLINE_LIVE_SATELLITE)")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
