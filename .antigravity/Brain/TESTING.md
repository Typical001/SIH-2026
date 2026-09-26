# Current verification — 26 September 2026

## Latest map and documentation checkpoint

- Report layering: browser checks at narrow and 1920px desktop widths showed the report above the map; desktop map bounds stayed inside the viewport.
- Route persistence: original disappearance was not reproduced in the in-app browser. After introducing dedicated SVG routes, all three paths remained drawn through small pans, clicks and zoom; no alert was present. This does not prove every browser/dateline case is fixed.
- Single-world experiment: noWrap/maxBounds and a fitted minimum zoom were tried, then reverted at the user's request after a reported route-display regression. Current tests expect worldCopyJump and no maxBounds. Horizontal repetition is therefore still possible.
- Final revert: 27 frontend tests passed across 5 files; default Fit route was visually checked. Production build passed before the final revert, not afterward. Backend code was unchanged by these map fixes; the 16-test result below belongs to the earlier routing checkpoint.
- This Brain reconciliation only reviewed documentation and source; it does not represent a new backend run, deployment or exhaustive browser audit.


## Backend

From backend: `venv/Scripts/python.exe -m unittest test_route_objectives test_observation_demo -v`

16 tests passed in 71.2 seconds. Includes all 20 gateway/station combinations with 3 default PC3 profiles each; each returned segment is checked against the applicable hazards, land, shelves and vessel rules. Every pair also verifies common speed/buffer, Fastest minimum time, Safest minimum exposure, and Balanced minimum combined cost among returned profiles. Added tests verify distinct optima on a controlled graph, no forced detours when optima coincide, current direction, overlap and dateline behavior. Also covers:

- Between-waypoint land collision and antimeridian crossing.
- Blocked endpoint / iceberg-start rejection, no fallback, unavailable-data 503, invalid inputs 422.
- Forecast/buffer changes, a large-envelope blocked scenario, speed and burn sensitivity.
- Zero fuel / reserve-aware recommendations and capacity validation.
- PC3 versus PC5 McMurdo eligibility and Open Water restriction.
- Small shared observation payload; lazy trajectory and envelope consistency.
- Custom coordinates, explicit saved waypoint persistence and no reset during calculation.
- No runtime external connection; all layer endpoints carry non-live labels.
- Concurrent profile requests generate one cached graph.

## Frontend and export

Worldwide map update: browser confirmed OpenStreetMap tiles loaded, global extent, visible attribution and working World view / Fit route buttons. Full-window mode retains Show planning panels. Map controls use capture handlers so Leaflet's propagation guard does not swallow React button actions. Coastline fallback remains below the tile pane; the frontend now intentionally makes external map-tile requests.

Google 3D is inactive following the requested return to the flat map. It is not part of this route-profile verification.

From frontend: `npm test` -> 27 passed across 5 files, including coastline failure/retry recovery and shared-corridor/objective labels.
`npm run build` -> passed, main JS approximately 358 kB (111 kB gzip); PDF libraries are loaded on demand.

Tests cover late-response suppression, aborts/timeouts, failed-route clearing, reset while already at defaults, profiles without extra fetches, route availability, consistent zero values, fuel controls, local map/offshore endpoints, iceberg filtering and actual PDF generation. The two-page PDF test output was text-extracted and page 1 visually inspected for layout and source labels.

Browser inspection confirmed three default routes, the fuel-feasible recommendation, observation/estimate banner, offshore endpoints and matching report metrics. Small-width layout now keeps the map visible and makes lower controls scrollable.

## Performance observations

Earlier 234–365 ms timings applied to the retired four-band graph. The expanded graph and overlap comparison measured roughly 0.9–6.2 seconds across three checked voyages before the overlap latitude prefilter; the default route measured 796 ms after the prefilter and restart, with the same comparison results. These are measurements, not latency guarantees. Default iceberg HTTP body previously measured 25,342 bytes, versus the earlier reported 24.6 MB. Map display is a separate local file loaded once and gzip-compressed by the backend.

Start/stop verification: health reported version 2.0.0 and 33 icebergs; default request returned 3 profiles. Stop-Project.ps1 left zero listeners on ports 8000/3000. Start-Project.ps1 restarted both services successfully. Final browser inspection showed all 3 routes, no console errors, and 1 matching iceberg in the default route corridor. Production desktop map geometry was visually checked.

## Scope

The current acceptance suite targets main.py, observed_data.py, observed_routes.py and route_geometry.py. Legacy backend test files and inactive UI panel files remain historical diagnostic material and are not evidence of current operational capabilities. No claim is made that this demo validates real-world navigation or that the uncalibrated forecast is accurate.

Toolchain deprecation warnings remain non-failing. The test suite does not require live data providers.
