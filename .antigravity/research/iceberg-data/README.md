# Iceberg research and extracted data

Downloaded 25 September 2026. These are research inputs; application behavior was not changed.

## Downloads and results

| Dataset | Extracted contents | Potential demo use |
|---|---|---|
| [USNIC Antarctic icebergs](https://usicecenter.gov/Products/AntarcIcebergs) | 33 records, all Last Update 2026-09-24; coordinates, dimensions and area | Fixed, dated iceberg scenario |
| [BYU current positions](https://www.scp.byu.edu/current_icebergs.html) | 38 records; page revised 2026-09-14 | Supplementary positions and comparison |
| [BYU consolidated v8 archive](https://www.scp.byu.edu/iceberg/default.html) | 647 CSV files; 516,691 dated rows | Historical movement replay |
| [USNIC Antarctic shelf](https://usicecenter.gov/Resources/AntarcticShelf) | 2,081 features: 357 shelf and 1,724 land polygons; 2022 vintage | Additional route obstacles |

`sources.json` records download URLs, retrieval timestamps, sizes and SHA-256 hashes. Original downloads are retained alongside the derived files. `summary.json` contains machine-readable counts. `historical_inventory.json` lists each historical file, row count, columns and parsed date range. Original historical CSVs are extracted into `historical_csv/` without changing their contents.

## Snapshot interpretation

`usnic_snapshot.geojson` and `byu_snapshot.geojson` use longitude, latitude order in decimal degrees. All snapshot IDs are unique within their source and coordinates passed range checks. The USNIC CSV has coordinates rounded to two decimal places; retain the supplied PDF when greater reported precision is needed, without assuming greater accuracy.

USNIC length and width are converted from nautical miles using 1 NM = 1.852 km. Area is preserved from the provided sqKM field. Last Update is not assumed to be the satellite observation timestamp. Thickness, mass and orientation are unknown and explicitly null; simulation values would require separate labels.

The BYU table matches the 38-record coordinates PDF. Its day-of-year values represent UTC observation days. The year 2026 is inferred from the page revision and recorded as such: day 252 = September 9, 251 = September 8, 225 = August 13, 211 = July 30. These are not September 24 observations.

There are 32 shared IDs and 39 distinct IDs across the snapshots. BYU-only IDs are B29, C33, C35, D30B, D36 and UK324. USNIC-only is D33D. Absence from one list does not prove an iceberg melted, disappeared or newly calved. BYU recommends USNIC precedence for conflicting records. Keep the original dated observations rather than merging coordinates silently.

Largest five in the USNIC snapshot by reported area: D15A 3,037.47 km²; B22A 1,371.96 km²; A81 1,341.79 km²; C36 848.13 km²; D15B 610.52 km². D15A dimensions convert to 94.452 × 40.744 km: a point marker alone does not describe its obstacle extent.

## Historical archive quality notes

The webpage advertises coverage 1978 through April 22, 2025, but the actual downloaded v8 file contains parsed dates from February 1, 1976 through April 30, 2026. For example D01 starts in 1976, A23A ends at raw date 2026090, and D15C ends in April 2026. Treat this as a source metadata discrepancy, not independently verified observation coverage.

Dates normally use YYYYDDD; some older rows use whitespace-padded YYDDD. Inventory conversion uses 19YY for YY >= 78 and 20YY otherwise for five-digit entries. Original dates remain unchanged in CSVs. The archive contains multiple sensor coordinate pairs, quality/interpolation indicators and missing-value zeros. Row count is not a count of independent satellite observations. Do not turn missing zero pairs into points at (0,0), average sensor coordinates blindly, or interpret interpolated daily rows as measured movement. Review the source schema and flags before choosing replay tracks. Historical replay must display its own date, not a live label.

## Shelf data and project recommendations

`shelf_inventory.json` preserves the actual projection WKT. This is WGS84 South Pole stereographic with central meridian 180° and standard parallel -60°; do not assume EPSG:3031. The original ZIP includes the shapefile and projection. Reprojection, antimeridian handling and polygon topology checks are required before use on the web map. Its 2022 vintage does not describe current ice fronts. Seasonal sea ice is not included. USNIC states no access/use limitations for this shelf dataset.

For the demo, start with the fixed USNIC snapshot and use an explicitly dated historical track for animation. Keep simulation forecasts separate from source observations. Render only viewport/route-corridor points with a Canvas/WebGL layer and show detailed information on selection. Keep full obstacle geometry available to route validation even when icons are hidden. Use shelf polygons as additional obstacles after checking whether station approach endpoints remain reachable.

These products do not supply complete small-iceberg coverage, bathymetry, reliable iceberg thickness/mass, or a future drift forecast. More historical rows alone do not resolve those gaps.

## Reproduction

`fetch_data.py` downloads the inputs using Python standard-library networking. `extract_data.py` produces GeoJSON and inventories using Python plus pyshp and pyproj (available in the project's backend virtual environment). It preserves differing pre-existing historical CSVs rather than overwriting them. Run only in a new snapshot folder when updating source versions so provenance remains reproducible.
