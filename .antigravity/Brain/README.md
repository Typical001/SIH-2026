# PolarNav project Brain

Reviewed **2026-09-19**, against local `main` at **2cc8271** (with PDF Export feature). This is the current documentation snapshot, replacing the overlapping September 17/18 checkpoint notes. Paths are relative to the application directory `.antigravity` unless stated otherwise.

PolarNav is the SIH-26059 polar route planning prototype: React dashboard, FastAPI service, iceberg drift forecasts and directed A* routing. It features an **Official PDF Bridge Navigational Report export** powered by **PolarNav Engine**, attempting external wind/current/iceberg requests and using SQLite environmental caching. This is a decision-support prototype; sea ice is synthetic, currents and icebergs can fall back to models, and provider provenance/offline handling remain under engineering review. It is not validated for operational navigation.

## Start here

| Document | Purpose |
| --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Current features, workflow, PDF report export and limitations |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Request flow, providers/cache, PDF generator, geometry, costs and models |
| [API_REFERENCE.md](API_REFERENCE.md) | Actual parameters, response fields, report data, and error behavior |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Local setup, PDF dependency configuration and deployment |
| [TESTING.md](TESTING.md) | Current 37/37 frontend and 27/27 backend results, verification boundaries |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Prioritized remaining work and status of NAV findings |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Main-only collaboration and change records |
| [FILE_INVENTORY.md](FILE_INVENTORY.md) | Every application/support file (including pdfGenerator.js) |
| [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md) | Verified local commit/file history through 2cc8271 |
| [CHANGELOG.md](CHANGELOG.md) | Changes and dated historical review records |

## Current verification

- Frontend: **37/37 tests pass** (100% pass rate). Production build passes cleanly with `jsPDF` and `jspdf-autotable`.
- Backend: **24 unittest cases and 3 pipeline checks pass (27/27)** with external providers replaced by deterministic fixtures. This does not establish passing live integration.
- Isolated diagnostics previously found cache/provenance issues; the current default demo path avoids external-provider latency. Live-mode cache validity, schema validation and endpoint error consistency remain unresolved.

See [TESTING.md](TESTING.md) for exact conditions. No browser, hosted deployment, clean install, live-provider contract or scientific validation was performed in this review.

## Recent changes and next work

- **PDF Voyage Execution Report Export**: Created `frontend/src/utils/pdfGenerator.js` powered by **PolarNav Engine**, rendering an official 5-section bridge execution report (Metadata, High-level metrics, XAI risk breakdown, Polar Code checklist, Waypoint table) downloadable directly from `DecisionSupport.jsx` and `RouteComparisonModal.jsx`.
- `6d1f221` restored request ownership, no-route errors, honest empty states and test tooling. `dedbb48` corrected visible controls, directed search, segment checks, baseline geometry, forecast envelopes and model metrics. `2cc8271` added provider requests, SQLite, an offline banner, same-origin API default and an accepted-but-unused backtest date.

Next priorities are bounding provider requests, correcting cache persistence/spatial validity, propagating actual data provenance and forecast times, and handling outages consistently. Complete coastline/vessel/model validation remains separate work.
