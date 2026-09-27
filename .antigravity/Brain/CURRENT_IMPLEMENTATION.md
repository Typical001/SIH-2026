# Current implementation

Reconciled 27 September 2026 against source `5898e40`. This page describes the active runtime only.

## Runtime and access

main.jsx wraps App in CaptainLogin. The dashboard and its requests mount only after backend authentication. captain_auth.py checks a provisioned account and issues an opaque eight-hour bearer token. auth.js adds it to application requests; a matching session's 401 returns to login. Tokens use sessionStorage; planning inputs use localStorage. Backend restart invalidates sessions. See [captain access](CAPTAIN_ACCESS.md).

App -> main.py -> observed_data.py / observed_routes.py -> route_objectives.py / route_geometry.py. Legacy provider/fixture/SQLite engines are inactive. Backend data is bundled; external OSM tile requests are frontend-only.

## Map and controls

The default is a centered rectangular dark Leaflet map with planning panels; expanded mode remains. OSM tiles use a dark CSS palette. Local land/shelf GeoJSON renders beneath tiles as fallback. Attribution is retained; maximum tile zoom is 19. Web Mercator omits the exact poles. GoogleEarthMap and the saved Google key are unused.

Tiles wrap, worldCopyJump is enabled and longitude bounds are unrestricted. ResizeObserver sets minimum zoom to `ceil(10 * log2(max(1, width, height) / 256)) / 10`, limiting the viewport to one complete tile-world without disabling horizontal travel. World view respects this constraint; it cannot guarantee all polar limits fit on every aspect ratio. Fit route restores the selected passage.

Routes/endpoints use SVG copies at -360/0/+360 longitude offsets; other geometry accounts for the visible copy. Dedicated route pane and Leaflet-managed teardown prevent effect-refresh detachment. Map/report stacking is isolated. Panning does not recalculate; Map Click departure mode deliberately changes the origin and triggers recalculation.

Official icebergs default to All 33: static 24px white/cyan SVG location icons, not size-scaled footprints. Near route (25/50/100 km corridor) and Explore area are optional. Display cap is 150 for the current 33-record catalog. Close observations can overlap. Drift rings/connectors appear at zoom 4+ or on selection. The locator lazily fetches trajectory and exact routing envelope. All obstacles remain in routing regardless of visibility.

UI controls: speed 8–22 kn in 0.5-kn steps, horizon 24–72 h in 12-h steps, buffer 10–50 km in 5-km steps. Saved horizons are clamped. Defaults: PC3, 14.5 kn, 72 h, 25 km, 450/500 t fuel, 12 t/day burn at 12 kn, 15% reserve. API limits are broader; see [API](API_REFERENCE.md).

Nine layer switches cover official icebergs, selected buffer, BYU references, calculated sea ice, calculated currents, calculated wind, derived SAR boxes, illustrative bathymetry and route profiles. SAR/bathymetry are not measured satellite acquisitions or clearance data.

## Observations and provenance

- 33 icebergs from the supplied AntarcticIcebergs_20260924.pdf. Extracted DMS coordinates retain reported precision. IDs, dimensions, dates, area and coordinate agreement were checked against the downloaded official USNIC CSV. Runtime file: backend/data/observed_icebergs.json; includes original PDF SHA-256.
- 38 earlier BYU positions, with observation years inferred from the page revision, provide comparison/reference points and a two-position drift estimate for 32 matching IDs. BYU-only points are explicitly earlier reference observations, not additional current obstacles with invented dimensions.
- Natural Earth 1:10m global land is bundled in backend/data/ne_10m_land.zip.
- All 2,081 USNIC 2022 land/shelf features are checked in their original projected CRS. 357 are ice shelves; 1,724 are land. The actual .prj is used, not an assumed EPSG:3031.
- Local display map: backend/data/map_base.geojson. Simplification affects the display only. Non-polygon repair artifacts are excluded from the display.
- Original downloads, hashes, 647 historical CSV tracks and 516,691 rows remain in research/iceberg-data. The historical archive's internal dates disagree with the advertised webpage range. It is not represented as a live feed or loaded in bulk into the dashboard.

## Estimates, assumptions and formulas

All estimates are labelled in the UI and export. These are transparent planning heuristics, not calibrated oceanographic forecasts or IMO POLARIS rules.

Let latitude be negative south, SIC range 0–1, distance D in nautical miles, and speeds in knots.

1. Sea ice: SIC = clamp((-latitude - 60) / 20, 0, 0.95).
2. Current/wind proxy: J = exp(-((latitude + 52) / 9)^2). Eastward current = 0.5 J kn; estimated wind = 10 + 15 J kn. Map samples and route metrics call the same environment function.
3. Vessel planning limits: PC1 100%, PC3 90%, PC5 75%, PC7 40%, Open Water 5% estimated SIC. No vessel may cross a mapped iceberg, shelf or land obstacle. These limits are application assumptions, not certification limits. PC3 can reach the McMurdo approach with defaults; PC5 is refused by the model.
4. Drift: geodesic displacement from matching BYU observation to the report position divided by elapsed time, capped at 2 km/h. The report update date is used as an observation-time proxy and this uncertainty is disclosed. Without a match (D33D), assume eastward drift of 0.03 km/h. Forecast points occur every 6 h plus the exact requested endpoint.
5. Iceberg exclusion radius = half reported size diagonal + user buffer + 0.25 km × forecast hours. All three profiles use the same buffer, vessel constraints and full hazard catalog. A convex hull enclosing buffered points covers the whole estimated trajectory; map detail uses exactly the backend's geometry. Circle polygon approximation has a 1% conservative margin. All reported icebergs participate regardless of map visibility.
6. Commanded speed V is the user's selected speed for every profile; the former 0.85 / 0.93 / 1.00 multipliers have been removed. Edge mean SIC is sampled and weighted by segment length; maximum SIC still enforces the vessel limit. Per-edge speed over ground = max(2, V × (1 - 0.5 mean SIC) × (1 - 0.002 wind_knots) + along-heading current). Directional edges account for following/opposing currents.
7. Reference burn defaults to 12 t/day at 12 kn, editable. Daily burn = reference burn × (V / 12)^3 × (1 + 0.5 SIC). Edge time = D / speed over ground; fuel = daily burn × time / 24. Sum over route edges.
8. Reserve defaults to 15% of tank capacity, editable. Feasible iff unrounded calculated burn + reserve <= available fuel. Recommendation compares returned (rounded) exposure among feasible profiles, breaking ties by returned time; search and fuel feasibility use unrounded values. If none are feasible, recommendation is null.
9. Cumulative ice-exposure hours = sum(edge travel hours × mean SIC). Safest minimizes this total, with travel time breaking ties. Fastest minimizes estimated travel hours. Balanced minimizes travel hours + 4 × ice-exposure hours; 4 is an explicit planning trade-off, not a calibrated risk conversion. The separate 0–100 display score is 100 × sum(edge distance × mean SIC) / total distance. Neither measure is collision probability or a safety guarantee. Minimum POLARIS RIO remains unavailable because the input data does not support that calculation.
10. Direct baseline uses the same speed/burn formulas along a sampled direct lon/lat line. Its geometry is checked separately. Negative savings are preserved; an obstructed baseline is labelled a hypothetical comparison, never returned as a route.
11. SAR control shows derived inspection boxes around reported icebergs, not invented radar acquisitions. Bathymetry control shows an explicitly illustrative proxy: 200 + 4000 × (1 - SIC)^2 m. It is not measured depth and is not used for clearance. Vessel position is a saved user waypoint or labelled assumed starting waypoint, never a live AIS claim.

## Route search and validation

Model `shared-constraints-objectives-v2`: exact lexicographic Dijkstra for Safest (exposure first, time second), NetworkX A* with zero heuristic for Balanced/Fastest (equivalent to Dijkstra for scalar costs). No per-profile speed multiplier remains. Fuel is checked after search; changing fuel alone does not initiate a fuel-optimal route search.

The finite graph includes offshore approach chains, alternate nodes, ocean bands from 35°S to 77°S in 3° steps plus 56/58/60/62°S, and 5° longitude spacing. Nodes consider 16 nearby neighbors within 350 NM; custom endpoints connect within 650 NM. Complete segments are checked against land and swept iceberg envelopes; shelf checks densify before source-CRS projection. Vessel limits are sampled along edges; final segments are revalidated. No unchecked fallback is accepted.

Overlap uses samples no farther than 10 km apart and a 10-km corridor tolerance. Pairwise result is the lower of two length-weighted percentages; 90% triggers shared-corridor labels. Coincident optima are retained, not shifted for appearance.

HTTP 409 means no eligible passage in this bounded network, not proof that none exists anywhere. Invalid input returns 422; unavailable required data returns 503. Fuel-infeasible but geometrically valid routes remain visible and are never recommended.

Caches are bounded (ROUTE_CACHE_SIZE default 36, deployed 4), protected from duplicate construction and warmed for defaults at startup. Calculation is serialized. Gzip applies above 1,000 bytes; summaries omit trajectories, which load on selection.

## Results, state and reports

Responses echo inputs, dataset/model identifiers and a request hash. Input changes clear old route/metric state before repaint, abort obsolete fetches and reject late responses. Profile selection is local. Browser cancellation does not guarantee cancellation of server computation.

Reset demo restores inputs/layers and recalculates; it does not log out. Public-demo waypoints stay in browser storage and backend writes return 403. Local saves use locked atomic JSON replacement. Active startup does not seed or read the old SQLite iceberg database.

Navbar opens Voyage report; the separate navbar Export PDF was removed. Sidebar/report exports remain. PDF libraries load on demand and include dates, estimates, objective/overlap information, fuel feasibility and forecast coverage. No certification is implied.

Public hosting/authentication are implemented. Operational limits remain: generalized coastlines, dated shelves and iceberg snapshot, missing small fragments, uncalibrated environment/drift/vessel assumptions, no measured hydrographic clearance and forecasts shorter than voyages. See [issues](KNOWN_ISSUES.md) and [testing](TESTING.md).
