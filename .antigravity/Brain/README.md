# PolarNav project Brain

Reviewed **2026-09-19**, against local `main` at **2cc8271** (with Frontend Login System and PDF Export features). This is the current documentation snapshot, replacing the overlapping September 17/18 checkpoint notes. Paths are relative to the application directory `.antigravity` unless stated otherwise.

PolarNav is the SIH-26059 polar route planning prototype: React dashboard, FastAPI service, iceberg drift forecasts and directed A* routing. It features **Mandatory Officer Authentication** (`AuthContext.jsx` & `LoginModal.jsx`), an **Official PDF Bridge Navigational Report export** powered by **PolarNav Engine**, attempting external wind/current/iceberg requests and using SQLite environmental caching with Open-Meteo circuit breaker fallback. This is a decision-support prototype; sea ice is synthetic, currents and icebergs can fall back to models, and provider provenance/offline handling remain under engineering review. It is not validated for operational navigation.

## Start here

| Document | Purpose |
| --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Current features, workflow, Login System, PDF report export and limitations |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Request flow, auth context, providers/cache, PDF generator, geometry, costs and models |
| [API_REFERENCE.md](API_REFERENCE.md) | Actual parameters, response fields, auth endpoints, report data, and error behavior |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Local setup, auth & PDF dependency configuration and deployment |
| [TESTING.md](TESTING.md) | Current 40/40 frontend and 24/24 backend results, verification boundaries |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Prioritized remaining work and status of NAV findings |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Main-only collaboration and change records |
| [FILE_INVENTORY.md](FILE_INVENTORY.md) | Every application/support file (including AuthContext, LoginModal, pdfGenerator.js) |
| [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md) | Verified local commit/file history through 2cc8271 |
| [CHANGELOG.md](CHANGELOG.md) | Changes and dated historical review records |

## Current verification

- Frontend: **40/40 tests pass** (100% pass rate). Production build passes cleanly with `jsPDF`, `jspdf-autotable`, and `AuthContext`.
- Backend: **24 unittest cases pass (24/24)** with external providers replaced by deterministic fixtures and Open-Meteo circuit breaker.
- Isolated diagnostics previously found cache/provenance issues; the current default demo path avoids external-provider latency. Live-mode cache validity, schema validation and endpoint error consistency remain unresolved.

See [TESTING.md](TESTING.md) for exact conditions. No browser, hosted deployment, clean install, live-provider contract or scientific validation was performed in this review.

## Recent changes and next work

- **Frontend Login System**: Implemented `AuthContext.jsx` (with `localStorage` persistence and 3 Quick Demo officer accounts: Capt. Alex Vance, Dr. Priya Sharma, Cmdr. Henrik Lind), `LoginModal.jsx` (dark polar glassmorphism UI), Navbar user profile dropdown, and FastAPI auth endpoints (`POST /api/v1/auth/login`, `POST /api/v1/auth/signup`).
- **PDF Voyage Execution Report Export**: Created `frontend/src/utils/pdfGenerator.js` powered by **PolarNav Engine**, rendering an official 5-section bridge execution report (Metadata, High-level metrics, XAI risk breakdown, Polar Code checklist, Waypoint table) downloadable directly from `DecisionSupport.jsx` and `RouteComparisonModal.jsx`.
- `6d1f221` restored request ownership, no-route errors, honest empty states and test tooling. `dedbb48` corrected visible controls, directed search, segment checks, baseline geometry, forecast envelopes and model metrics. `2cc8271` added provider requests, SQLite, an offline banner, same-origin API default and an accepted-but-unused backtest date.

Next priorities are bounding provider requests, correcting cache persistence/spatial validity, propagating actual data provenance and forecast times, and handling outages consistently. Complete coastline/vessel/model validation remains separate work.
