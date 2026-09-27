# Verification and test commands

Reconciled 27 September 2026 against source 5898e40. Results distinguish the preceding implementation from this documentation pass; no new exhaustive browser/PDF/load audit is implied.

| Check | Result | Evidence date/scope |
|---|---|---|
| Frontend Vitest | 35 passed, 7 files | 27 Sep captain implementation; login and existing UI/map/PDF utility tests |
| Vite build | Passed | 27 Sep captain implementation; main JS ~366 kB / 113 kB gzip, separate PDF libraries |
| test_observation_demo | 14 passed | 27 Sep authenticated API regression run |
| test_captain_auth | 3 passed | 27 Sep anonymous/forged denial, login/logout, expiry and throttle |
| test_route_objectives | 4 passed | Rerun successfully during this documentation reconciliation |
| Live Netlify/Render | Verified | 27 Sep login-only page, successful login, 33 observations, three default profiles, logout and anonymous 401 |
| Frontend credential scan | Passed | Plaintext password absent from built frontend; local recovery file ignored |

The backend total is 21 across three suites, not a claim that all ran together. Old 16/18 backend and 27/31/32 frontend totals are historical and retained in the archive.

## Commands

From .antigravity/backend:

```powershell
.\venv\Scripts\python.exe -m unittest test_observation_demo test_route_objectives test_captain_auth -v
```

From .antigravity/frontend:

```powershell
npm.cmd test
npm.cmd run build
```

Bundled Node alternatives: `..\nodejs\node.exe node_modules/vitest/vitest.mjs run` and `..\nodejs\node.exe node_modules/vite/bin/vite.js build`. Setup installs test dependencies via requirements-dev.txt. Broad backend discovery includes retired-engine tests and is not the active acceptance command.

## Coverage

Observation tests check all 20 gateway/station pairs and three default PC3 profiles, every segment, shared speed/buffer and objective comparisons. They cover between-waypoint/date-line geometry, blocked endpoints, invalid inputs, missing data, no fallback, forecast/buffer/speed/burn effects, fuel/reserve/capacity, class restrictions, shared compact observations/lazy detail, local/public waypoint behavior and concurrent graph construction. External connections are forbidden in that controlled backend suite.

Objective tests verify different optima in a controlled graph, time tie-breaking without forced detours, directional currents, and overlap including date-line paths. They do not establish visual correctness.

Frontend tests cover stale requests, cancellations/timeouts, resets, profile selection, availability, zero metrics, controls, coastline recovery, wrapping helpers, iceberg filters, report generation and authentication mounting boundaries. Most UI tests mock Leaflet/network behavior. Auth tests use a test verifier, not real credentials in source.

## Browser and operational evidence

Latest live default route: Safest 3371.15 NM / 243.16 h, Balanced 3005.70 NM / 218.36 h, Fastest 2959.98 NM / 216.35 h, all fuel-feasible under defaults. These are dated observations, not invariants for changed inputs. Logout restored login. Anonymous /api/auth/session and /api/v1/icebergs returned 401.

Earlier 26 Sep checks covered dark contrast, 33 icon elements, selected D15A forecast, map/report stacking at narrow/desktop sizes, default and Hobart–McMurdo fitting, world-seam pan and optional overlays. They were not all rerun after login. The original disappearing-route report was not reproduced before the SVG repair; post-change checks passed within that scope.

Earlier PDF work generated/text-extracted a two-page report and visually inspected page 1. Latest login work did not repeat manual PDF download inspection. Earlier start/stop checks verified health and release of ports 3000/8000; scripts were not rerun in this documentation pass.

No penetration test, government identity integration, multi-worker session test, sustained load test, new source-data validation or forecast calibration was performed. Geometry/model tests do not certify navigation. Vite/plugin and Starlette/httpx warnings remain non-failing. Cold-start timing is not guaranteed.
