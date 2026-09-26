# Current implementation — 26 September 2026

## Dark map and full iceberg catalog — 26 September 2026

Follow-up: iceberg labels are hover/focus tooltips instead of zoom-dependent permanent tooltips, avoiding labels remaining open when returning from a close inspection to route overview.

The active map uses a dark tile-only CSS palette with dark fallback land/water and readable controls; overlays retain their original bright colors. Official iceberg display now defaults to All 33, superseding near-route-only defaults below. Each reported position gets a static 24px white/cyan iceberg SVG icon with accessible title and tooltip. All catalog markers remain enabled independent of route/view; offscreen positions require panning or the locator, and close positions can overlap at overview zoom. Near route and Explore area remain optional filters. Forecast rings/connectors appear at zoom 4+ or for the selected iceberg; selected trajectory and hazard detail remain lazy-loaded. Coordinates are unchanged.

Validation: 32 frontend tests passed, including all-catalog selection outside the viewport and existing route filtering. Browser verified 33 marker elements, readable route contrast, D15A selection/forecast popup and no alert.

Forecast limit update: maximum horizon is 72 hours (3 days), enforced by route request validation and iceberg summary/trajectory query validation. UI range remains 24 hours minimum with 12-hour steps; default is 72. Saved browser horizons above the cap are clamped on initialization. The days label reflects the selected duration. Voyage coverage warnings remain; a longer voyage does not imply a forecast beyond 72 hours.

## Centered map follow-up — 26 September 2026

This checkpoint supersedes the earlier full-window default and low-zoom repetition notes. The app now opens with planning panels and a bordered rectangular map. Horizontal wrapping/worldCopyJump remain enabled, with no fixed longitude bounds. ResizeObserver sets minimum zoom to ceil(10 × log2(max(viewport width, height) / 256)) / 10, so the viewport never spans multiple complete worlds. World view respects this limit; on wide screens it is an overview, not a guarantee that both poles fit vertically. Fit route restores the selected passage.

SVG route and endpoint copies at longitude offsets -360/0/+360 stay aligned across the date line. Reference/estimated polygon layers and iceberg positions also account for display wrapping; route-corridor filtering normalizes continuous backend longitudes. Renderer teardown belongs to Leaflet, preventing React effect refresh from detaching live SVG paths. The report stacking fix remains active.

Validation: 31 frontend tests across 6 files; desktop default and Hobart–McMurdo route fitting, world-seam pan, all optional layers enabled with visible routes, report open/close, and no alert observed. Backend routing was unchanged. See TESTING.md for the current verification scope.


This document supersedes the September 24 live-provider audit and September 25 simulated-fixture design. The user requested actual supplied/researched observations, then explicitly authorized calculated estimates for missing data while retaining the features.

## Active architecture

Latest map update (26 September): the default full-window map now uses OpenStreetMap worldwide raster tiles with visible attribution, street-level zoom (19), horizontal world wrapping and no regional pan bounds. Show planning panels restores the controls; World view fits the global extent and Fit route restores the selected passage. Standard Web Mercator tiles cover approximately 85.05°S–85.05°N, not the exact poles. The local Natural Earth/USNIC coastline renders beneath tiles as a fallback. Online detail requires internet; routing and observation APIs remain local. Tiles load only for the viewed area, using normal browser caching; no bulk download or offline tile archive. Policy: https://operations.osmfoundation.org/policies/tiles/ . This supersedes earlier statements that the frontend makes no external map requests.

PolarMap uses Leaflet/OpenStreetMap. GoogleEarthMap.jsx is unmounted; there is no active Google mode or Google flat-map integration. The saved key is not used by the active map. The earlier request to use Google data in the flat map has not been implemented. The sidebar exposes nine layer controls, including route profiles.

Latest display checkpoint: workspace and map isolate stacking contexts and clip overflow; the map flex item has min-width zero. Report-overlay uses z-index 2000, above the map toggle at 1500 and expanded workspace at 100. Routes use a dedicated SVG renderer in pane route-profiles at 450, above environmental overlays; bulk iceberg observations remain on canvas. Route clicks do not bubble into map-coordinate selection. Ordinary map clicks only select an origin in Map Click mode.

The noWrap/maxBounds single-world restriction was reverted at the user's request after routes appeared outside the map. Tiles wrap, worldCopyJump is enabled, and neither map nor tiles have fixed world bounds. Minimum zoom is min(0, the zoom fitting the world to the viewport). Repeated continents at low zoom remain possible. Fit route was browser-checked after the revert for the default Cape Town–Bharati passage.

React App -> FastAPI main.py -> observed_data.py / observed_routes.py -> route_objectives.py / route_geometry.py.

No active runtime imports data_engine.py, drift_engine.py, pathfinder.py, demo_passages.py or database.py. These legacy modules and their old tests remain for historical reference; their fabricated iceberg registry, network providers, SQLite seeding and fallback routes are not used. Existing SQLite contents are preserved, not used as the current observation catalog.

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
8. Reserve defaults to 15% of tank capacity, editable. Feasible iff unrounded calculated burn + reserve <= available fuel. Recommendation selects the lowest cumulative estimated ice-exposure hours among fuel-feasible profiles, breaking ties by travel time. If none are feasible, recommendation is null.
9. Cumulative ice-exposure hours = sum(edge travel hours × mean SIC). Safest minimizes this total, with travel time breaking ties. Fastest minimizes estimated travel hours. Balanced minimizes travel hours + 4 × ice-exposure hours; 4 is an explicit planning trade-off, not a calibrated risk conversion. The separate 0–100 display score is 100 × sum(edge distance × mean SIC) / total distance. Neither measure is collision probability or a safety guarantee. Minimum POLARIS RIO remains unavailable because the input data does not support that calculation.
10. Direct baseline uses the same speed/burn formulas along a sampled direct lon/lat line. Its geometry is checked separately. Negative savings are preserved; an obstructed baseline is labelled a hypothetical comparison, never returned as a route.
11. SAR control shows derived inspection boxes around reported icebergs, not invented radar acquisitions. Bathymetry control shows an explicitly illustrative proxy: 200 + 4000 × (1 - SIC)^2 m. It is not measured depth and is not used for clearance. Vessel position is a saved user waypoint or labelled assumed starting waypoint, never a live AIS claim.

## Route validation and behavior

Routing model `shared-constraints-objectives-v2` uses exact lexicographic Dijkstra for Safest (exposure first, time second), and NetworkX A* with a zero heuristic for Balanced and Fastest (equivalent to Dijkstra). Tests compare time/weighted-cost search with independent Dijkstra costs and exercise a three-corridor graph where each objective has a distinct optimum. The same vessel, speed and buffer apply to every profile. This optimizes the finite graph's objective, not a globally optimal or certified ocean passage. Each response identifies its algorithm and objective.

Corridor comparison samples paths at intervals no greater than 10 km and checks whether points are within 10 km of the other path. Pairwise overlap is the lower of the two length-weighted percentages. At 90% or more, cards explicitly show which profiles share a corridor. Coincident optima are retained honestly; no route is offset or forced to detour just to look different. Selected routes use a solid heavy line; alternatives use distinct dash patterns. Objectives and overlap are included in the PDF export.

Map visibility repair (26 September): removed the near-black CSS ocean override, added contrasting land/shelf colors, ResizeObserver size recovery, Fit route, and coastline timeout/retry with unmount-safe fetch handling. Narrow screens place a 420px-minimum map above scrollable planning inputs. Reported iceberg positions use bright canvas dots; calculated endpoints use amber rings with dashed connectors. Near-route filtering remains the default; explicit Explore area works at overview zoom with viewport filtering and the 150-record cap. Locate an iceberg zooms to its actual positions and fetches its detailed trajectory/envelope. Small drift can overlap at overview scale; coordinates are never artificially separated.

All five gateways and four stations remain available. Existing facility coordinates identify locations; preset voyages start/end at labelled offshore planning approaches. Harbour entry and station shore transfer are not modelled.

The finite search graph includes approach chains, alternate approach nodes and ocean bands from 35°S to 77°S at 3° intervals, plus the original 56/58/60/62°S bands. Longitude spacing is 5°. Each node considers its 16 nearest local neighbors within 350 NM using a spatial index. Custom endpoints connect to nearby candidates within 650 NM. This allows alternative passages well beyond the original four bands while keeping the graph bounded. Edges have complete lon/lat segment intersection checks against land and estimated iceberg envelopes. Shelf checks densify the line before transforming into its source CRS. Vessel limits are checked along sampled edges. Returned route segments are revalidated; no geometric fallback is accepted.

No-path returns HTTP 409 with “No safe route available”; invalid inputs return 422; unavailable required data returns 503. A larger buffer or longer forecast can legitimately block a route. A failed bounded-network search does not establish that no route exists anywhere in the ocean.

Graph caches are bounded and guarded against simultaneous duplicate construction. Shared default constraints warm during startup. Forecast summary contains no detailed trajectories; selecting an iceberg fetches only that detail. Local gzip responses and Canvas markers avoid the old 24.6 MB forecast transfer and mass animated markers. The backend makes no external provider requests; the frontend uses online map tiles as described above.

## UI consistency and persistence

Route requests echo validated inputs, a request hash and dataset/model ID. Input changes abort older frontend requests, clear the route and metrics before repainting, and guard against late responses. Profile selection changes the displayed result without recalculating. Map markers use returned offshore endpoints; buffer detail uses the selected profile's actual buffer.

Inputs persist in versioned browser localStorage. Reset demo restores defaults, layer visibility and recalculates even if inputs were already default. Manual coordinate entry explicitly saves the user waypoint; route calculation does not overwrite it. Backend writes use a lock and atomic file replacement. Start/stop does not reseed vessel state.

PDFs load their library only when needed and show observation dates, estimate labels, fuel feasibility and forecast coverage gaps. They contain no claimed collision probability or navigation certificate.

## Remaining boundaries

This is a working local demonstration, not validated operational navigation. Sea ice, wind, currents, depth, fuel and drift assumptions need real measurements/calibration for operational use. Natural Earth is generalized coastline; shelf boundaries date from 2022; the iceberg catalog does not include every small fragment. Forecast duration can be shorter than the voyage, which the UI/export disclose. Public hosting/authentication, hydrographic clearance and live sensor ingestion are outside this local-demo implementation.

See RUNNING.md, TESTING.md and KNOWN_ISSUES.md for commands and verification status.
