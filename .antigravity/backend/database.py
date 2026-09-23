"""
SQLite Edge Database Layer Module (database.py)
Embedded offline storage for Antarctic Decision Support System (SIH Problem Statement SIH26059).
Stores ocean environmental snapshots (wind, current, sea ice) and USNIC iceberg registry polygons.
"""

import sqlite3
import os
import json
import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List

logger = logging.getLogger("PolarNav.Database")

DB_FILENAME = "polar_nav_offline.db"
DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), DB_FILENAME)


def get_db_connection(db_path: str = DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def init_sqlite_db(db_path: str = DB_PATH) -> str:
    """
    Initializes polar_nav_offline.db and creates tables if they do not exist.
    """
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Ocean Environmental Cache Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ocean_environmental_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lat REAL NOT NULL,
            lon REAL NOT NULL,
            sea_ice_concentration REAL NOT NULL,
            u_wind REAL NOT NULL,
            v_wind REAL NOT NULL,
            u_current REAL NOT NULL,
            v_current REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 2. Iceberg Registry Cache Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS iceberg_registry_cache (
            iceberg_id TEXT PRIMARY KEY,
            geojson_geometry TEXT NOT NULL,
            area_sqkm REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    logger.info(f"Initialized SQLite database at: {db_path}")
    return db_path


def save_ocean_snapshot(lat: float, lon: float, sea_ice: float,
                        u_wind: float, v_wind: float,
                        u_current: float, v_current: float,
                        db_path: str = DB_PATH) -> int:
    """
    Writes newly fetched ocean environmental snapshot into SQLite.
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    now_utc = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        INSERT INTO ocean_environmental_cache 
        (lat, lon, sea_ice_concentration, u_wind, v_wind, u_current, v_current, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (round(lat, 4), round(lon, 4), round(sea_ice, 4),
          round(u_wind, 4), round(v_wind, 4),
          round(u_current, 4), round(v_current, 4), now_utc))
    row_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return row_id


def save_iceberg_snapshot(iceberg_id: str, geojson_str: str, area_sqkm: float,
                          db_path: str = DB_PATH) -> str:
    """
    Persists active USNIC iceberg polygons into SQLite.
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    now_utc = datetime.now(timezone.utc).isoformat()
    cursor.execute("""
        INSERT OR REPLACE INTO iceberg_registry_cache
        (iceberg_id, geojson_geometry, area_sqkm, timestamp)
        VALUES (?, ?, ?, ?)
    """, (iceberg_id, geojson_str, round(area_sqkm, 2), now_utc))
    conn.commit()
    conn.close()
    return iceberg_id


def get_latest_ocean_snapshot(lat: float, lon: float, db_path: str = DB_PATH) -> Optional[Dict[str, Any]]:
    """
    Retrieves the most recent ocean snapshot for given coordinates (SELECT * ... ORDER BY timestamp DESC LIMIT 1).
    Falls back to closest spatial match or latest global snapshot if exact point match is missing.
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    # 1. Exact or rounded lat/lon query
    cursor.execute("""
        SELECT * FROM ocean_environmental_cache
        WHERE round(lat, 1) = round(?, 1) AND round(lon, 1) = round(?, 1)
        ORDER BY timestamp DESC LIMIT 1
    """, (lat, lon))
    row = cursor.fetchone()
    if not row:
        # 2. Spatial delta window search (within +/- 3 deg)
        cursor.execute("""
            SELECT * FROM ocean_environmental_cache
            WHERE abs(lat - ?) <= 3.0 AND abs(lon - ?) <= 4.0
            ORDER BY timestamp DESC LIMIT 1
        """, (lat, lon))
        row = cursor.fetchone()
    if not row:
        # 3. Global latest snapshot fallback
        cursor.execute("""
            SELECT * FROM ocean_environmental_cache
            ORDER BY timestamp DESC LIMIT 1
        """)
        row = cursor.fetchone()

    conn.close()
    if row:
        return dict(row)
    return None


def get_latest_icebergs(db_path: str = DB_PATH) -> List[Dict[str, Any]]:
    """
    Retrieves all latest iceberg registry records ordered by timestamp DESC.
    """
    conn = get_db_connection(db_path)
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM iceberg_registry_cache
        ORDER BY timestamp DESC
    """)
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]


if __name__ == "__main__":
    print("--- Running Database Verification ---")
    db_file = init_sqlite_db()
    print(f"1. Database Initialized at: {db_file}")

    # Write ocean snapshot test
    row_id = save_ocean_snapshot(
        lat=-58.45, lon=34.20,
        sea_ice=0.35, u_wind=12.5, v_wind=-3.2,
        u_current=0.45, v_current=0.08
    )
    print(f"2. Saved Ocean Snapshot (ID: {row_id})")

    # Read back ocean snapshot test
    latest_ocean = get_latest_ocean_snapshot(-58.45, 34.20)
    print(f"3. Fetched Latest Ocean Snapshot: {latest_ocean}")

    # Write iceberg snapshot test
    sample_geojson = json.dumps({
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": [[[34.2, -58.45], [34.3, -58.45], [34.3, -58.5], [34.2, -58.45]]]}
    })
    save_iceberg_snapshot("IB-A23A", sample_geojson, 1512.0)
    print("4. Saved Iceberg Snapshot for IB-A23A")

    # Read back icebergs test
    icebergs = get_latest_icebergs()
    print(f"5. Fetched Latest Icebergs (Count: {len(icebergs)}): {icebergs[0]['iceberg_id']}")

    assert os.path.exists(db_file), "Database file does not exist on disk!"
    print(f"SUCCESS: {DB_FILENAME} exists on disk and is fully functional!")
