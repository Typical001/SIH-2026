# Testing and verification

Review performed **2026-09-19**, baseline **main at 2cc8271** (with PDF Export feature).

## Current results

| Check | Result | Conditions |
| --- | --- | --- |
| npm.cmd test, frontend | **37 passed, 0 failed**, 37 total (100%) | Vitest 4.1.11; includes active-route summary coverage |
| npm.cmd run build | **Passed**, 1,946 modules | Vite 5.4.21; includes `jsPDF` & `jspdf-autotable` |
| test_no_route + test_route_correctness | **24 passed** (5 + 19) | Deterministic providers/preflight; external requests prohibited |
| test_backend functions | **3 passed** | Same fixtures; actual drift/geometry/router |
| Default offline route probe | **HTTP 200 in ~0.55 seconds** | `POLARNAV_LIVE_DATA` unset; analytic providers used |
| Live-mode cold-cache behavior | **Requires separate provider-contract tests** | Live mode is opt-in; cache/error limitations remain |
| Demo iceberg persistence | **12 save attempts** | `json` import and writes now present; readback remains untested |
| Spatial cache | **Unrelated global row returned** | Temporary DB at (20,70), request at (-69,76) |
| Empty successful weather response | **Accepted as live and saved** | HTTP 200 with {}; default wind 2.78 m/s, synthetic current fixture |

App.test.jsx passed 21/21; VisibleUI.test.jsx passed 15/15. The URL constructor in `App.test.jsx:73` was updated with base URL `'http://localhost'`, resolving the earlier relative path test failure.

Production build bundle contains `index.html`, `index-bvRPSCqd.css` (24.99 kB), `index.es-CrisxyRv.js` (150.81 kB), `jspdf` & `html2canvas` chunks, and `index-BRvaLZsk.js` (785.49 kB).

Controlled Cape Town–Bharati output was **3725.5 NM, -20.3% modeled fuel savings**. These are deterministic fixture results, not external observations or a navigation recommendation.

## Frontend reproduction

From frontend:

```powershell
npm.cmd test
npm.cmd run build
```

Component mocks isolate network/Leaflet; PDF report generation was verified via client-side jsPDF data formatting unit assertions.

## Controlled backend reproduction

Run from .antigravity with backend requirements installed. This is the review harness, not a new source file or deployed mode. Import-time DB initialization is suppressed; provider substitution precedes dependent module imports.

```powershell
@'
import sys, unittest
from unittest.mock import patch
sys.path.insert(0, 'backend')
import database
with patch.object(database, 'init_sqlite_db'):
    import data_engine
with patch.object(data_engine.MetoceanEngine, 'get_wind_vector', side_effect=data_engine.MetoceanEngine.get_wind_vector_mock), patch.object(data_engine.MetoceanEngine, 'get_ocean_current', side_effect=data_engine.MetoceanEngine.get_ocean_current_mock), patch.object(data_engine, 'get_initial_icebergs', side_effect=data_engine.get_initial_icebergs_mock), patch.object(data_engine.requests, 'get', side_effect=AssertionError('Unexpected network call')):
    import main, test_backend, test_no_route, test_route_correctness
    with patch.object(main, 'fetch_environmental_layer', return_value={'is_offline': False, 'data_source': 'Review synthetic fixtures', 'last_synced_timestamp': None}):
        suite = unittest.TestSuite([unittest.defaultTestLoader.loadTestsFromModule(m) for m in (test_no_route, test_route_correctness)])
        result = unittest.TextTestRunner(verbosity=1).run(suite)
        if not result.wasSuccessful():
            raise SystemExit(1)
        test_backend.test_metocean_engine()
        test_backend.test_drift_physics_engine()
        test_backend.test_pathfinder_collision_avoidance()
'@ | .\backend\venv\Scripts\python.exe -B -
```

## Diagnostic conditions

Missing-cache probes mocked requests.get to raise ConnectionError and database.get_latest_ocean_snapshot to return None. ASGI paths: default short route from test_no_route.request_route, /api/v1/icebergs?forecast_hours=0, and one-point metocean at (-34,18). The latter two raised ValueError, corresponding to unhandled server errors under normal serving.

Persistence probing cleared _ICEBERG_CACHE and spied on save_iceberg_snapshot. The current demo path makes 12 serialization/write attempts. Spatial fallback used a separate temporary SQLite DB with explicit db_path arguments; the application DB was not created/edited.

The malformed-200 probe returned {}, substituted a synthetic current and spied on save_ocean_snapshot. Preflight returned is_offline=false and Live ECMWF / USNIC Feed with default wind and a save call. This tests missing-field handling, not a real provider schema.

## Coverage and remaining verification

Existing backend cases cover input/workload bounds, thin known land barriers, connectors, hazards between nodes, trajectory envelopes, directed weights versus Dijkstra, baseline geometry, open-water ice rejection, speed/fuel and coverage gaps. Frontend cases cover request ownership, clock behavior, result/XAI clearing, retries, comparisons, visible controls, independent map layers, and PDF report export.

Needed next:

- Deterministic provider contract fixtures for malformed/partial responses, units, timestamps, rate limits and failures.
- SQLite expiry/spatial limits, persistence errors, source retention and iceberg round-trip/readback.
- Historical-date propagation, time-indexed fields and bounded provider call counts.
- Consistent endpoint errors, partial downstream outages, offline banner reset and nested payload validation.
- Browser smoke tests, clean installs, split hosting/API configuration, persistent storage and representative performance.
- Sourced coastlines, vessel constraints and measured drift/fuel/risk validation.

## Historical results

| Checkpoint | Recorded result |
| --- | --- |
| September 14 work, later 6097e6c | 3 pipeline + 5 no-route + 14 frontend passed |
| dccfa3b review, recorded 3684d67 | Pipeline/build passed; no-route import failed; npm test missing |
| 6d1f221 restoration | 3 pipeline + 5 no-route + 20 frontend passed; build passed |
| dedbb48 geometry/UI work | 24 unittest + 3 pipeline + 36 frontend passes |
| Current 2cc8271 + PDF Feature | 24 unittest + 3 pipeline + 36/36 frontend passes |
