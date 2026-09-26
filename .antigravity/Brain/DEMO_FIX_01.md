> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

# Demo fix 01: reject invalid route geometry

## Current replacement — 26 September 2026

The safety work now runs through observed_routes.py and route_geometry.py with supplied/researched observations, global land and USNIC shelves. No successful geometric fallback is returned. The offshore decision is resolved; all 20 preset pairs are covered by the current backend suite. The previous 14/17 counts below belong to the retired fixture checkpoint; the current recorded suite counts are 16 backend and 27 frontend.

Recent map changes affect display only: dedicated SVG routes, report stacking isolation, and restoration of horizontal wrapping after the single-world boundary experiment. They do not alter route computation or segment validation. See [TESTING.md](TESTING.md) and [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md).


**Latest status:** the offshore-point decision below is resolved. Automatic preset
passages are implemented and all 20 port/station combinations return three validated
demo routes. See [DEMO_PRESETS.md](DEMO_PRESETS.md). Earlier pending notes below are
historical. Current focused checks: 14 backend tests and 17 frontend tests passed.

## Follow-up: prolonged calculation fixed (2026-09-25)

Land endpoints were being checked after expensive whole-passage graph preparation.
The frontend also awaited the iceberg download alongside routing, without a request
deadline. Moved the land-endpoint check before provider calls and graph allocation;
added a 20-second graph-preparation budget; separated overlay fetching from route
loading and added a 30-second frontend route deadline with a visible timeout error.
The running backend was restarted. Focused checks now pass: **12 backend tests and
17 frontend tests**, including blocked-endpoint early rejection, stalled requests
and a pending overlay download. Offshore approach-point selection remains pending.

Date: 2026-09-25. User direction: a working simulated-data demo, retaining all
five existing gateway ports and four Antarctic stations. Address issues one at a
time, research/download needed data, explain implementation and ask for specific
product decisions.

## What and why

Previously, failed searches could become invented successful geometric routes;
grid edges, terminal connectors and the northern transit leg lacked full land
intersection checks. The old land mask covered five small areas near India.

Implemented local Natural Earth 1:10 million land polygon checks, including
Antarctica, for complete segments. Buffered forecast circles are checked against
segments, including high-latitude and date-line fixtures. This validates against
the supplied forecast endpoints; full time-dependent hazard coverage remains
part of the shared simulation/forecast work, not a claim of this fix.

## Where and how

- `backend/data/ne_10m_land.zip` and its README contain the downloaded source,
  version, checksum and public-domain provenance. No runtime coastline download.
- `backend/route_geometry.py`: spatial index, coastline intersections, conservative
  geodesic-circle polygon approximations, date-line handling and final validation.
- `backend/pathfinder.py`: search the entire passage, check edges/connectors,
  preserve exact endpoints, include latitudes down to -85, return only validated
  profiles; no automatic geometric fallback. Directed edges preserve directional
  costs. Cache segment checks within a request. Legacy routes also get segment,
  terminal and final-output checks.
- `backend/main.py`: no-path is HTTP 409; failed forecast or compute is HTTP 503.
  No success geometry accompanies those errors. Available profiles can number 1–3.
- Frontend clears previous results while recalculating and after failure, displays
  the backend message, and marks missing profiles unavailable rather than inventing
  profile cards. The prior iceberg rendering improvements remain.
- `backend/requirements.txt`: declare pyproj and pyshp so the new coastline reader
  and existing projection imports are reproducible.

## Verification and limits

Offline focused backend regression suite: `python -m unittest test_demo_route_safety -v`.
Tests redirect startup SQLite writes to a temporary database and disallow network.
They cover actual coastline points, narrow islands, touching boundaries, high-
latitude iceberg crossings, date-line segments, blocked graphs, real A* detours,
legacy land endpoints, computation failure, no path and forecast failure.

Verification result: **11 backend tests and 15 focused frontend tests passed**.
Production frontend build, Python compilation and `git diff --check` passed. The
existing large-bundle warning remains (main JS approximately 818 kB).

Frontend tests cover prior-route clearing after a 409 and unavailable profile cards,
alongside the existing iceberg visibility tests. These focused checks do not claim
that older unrelated test failures are resolved.

**Pending user decision:** whether ship routes may use labelled illustrative
offshore approach points while retaining original port/station markers. Cape Town
and McMurdo coordinates are on land in the downloaded dataset. Exact coordinates
now correctly fail validation. No offshore coordinate substitutions have been
applied. All 20 gateway/station combinations still need demo scenario validation
after this decision; this step is not yet a presentation-ready all-port demo.

Remaining work: shared deterministic simulation data and scenarios, effective
controls, vessel rules, calculated metrics, full provenance/UI/report labelling,
offline operation, startup/reset and broader tests. Natural Earth is generalized
geography, not surveyed port/ice-shelf navigation data. Keeping this distinction is
part of the demo design.
