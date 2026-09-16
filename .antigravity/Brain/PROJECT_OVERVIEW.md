# Project overview

## Purpose and scope

The project demonstrates how iceberg forecasts and environmental traversal costs can influence expedition routes to Antarctic research stations. Intended demo users include expedition planners, researchers and SIH evaluators. These are inferred use cases, not a verified requirements specification.

The implemented system has no database, account management, authentication, machine-learning model, real satellite ingestion, scheduled refresh service, or persisted voyage history. “AI” in the branding refers to the application presentation; the code uses deterministic formulas and graph search.

## Implemented capabilities

- Three expedition presets: Cape Town to Bharati, Cape Town to Maitri, and Hobart to Casey.
- Departure override through 13 Indian ports or manually entered latitude/longitude.
- Vessel classes PC1, PC3, PC7 and Open Water, each selecting a sea-ice cost formula.
- Forecast slider: 0–72 hours in six-hour steps; the API accepts 0–168 hours.
- Base buffer slider: 10–50 km in five-kilometer steps; the API accepts 5–100 km.
- Route and direct-baseline lines, initial/predicted iceberg markers, hazard circles, drift trails and illustrative sea-ice regions.
- Telemetry and analytics panels for distance, voyage time, modeled fuel usage and risk.

Cruising speed defaults to 14.5 knots. Although speed state and a change callback exist, the control panel currently renders no speed input. Initial iceberg visibility and metocean visibility exist in state, but have no control-panel buttons. The metocean grid is never fetched by the application.

## Typical demo workflow

1. Start the API and dashboard using the development guide.
2. Select an expedition preset and optionally override the departure port.
3. Select a vessel class and adjust forecast horizon and safety buffer.
4. Inspect the computed route, iceberg markers and layer controls.
5. Open Analytics to compare the displayed route metrics with the baseline.

Route parameter changes trigger requests automatically. Stable coordinate values and scalar settings prevent unrelated rerenders from refetching. Manual refresh starts a request; superseded requests are aborted and stale results ignored.

## Technology and dependencies

| Area | Declared stack | Role |
| --- | --- | --- |
| Client | React 18, React DOM, React Leaflet 4, Leaflet 1.9 | UI, state and map |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer, Lucide React | Styling and icons |
| Build | Vite 5, React Vite plugin | Development and production bundling |
| Frontend testing | Vitest 4.1.11, React Test Renderer 18.3.1 | Component tests for requests, failure states and no-route handling |
| API | FastAPI, Uvicorn, Pydantic | HTTP service and parameter validation |
| Computation | NumPy, NetworkX, Shapely | Sampling, graphs and land geometry |
| Other declarations | SciPy, requests, proj4, proj4leaflet, clsx, tailwind-merge | Declared dependencies without demonstrated use in reviewed application source |

Exact JavaScript resolutions are in `frontend/package-lock.json`; Python requirements specify minimum versions without a lockfile. Bundled Node and Java editor extensions are development artifacts, not backend services.

## Data and external resources

`backend/data_engine.py` defines 12 static iceberg records and six stations/ports: Cape Town, Bharati, Maitri, McMurdo, Casey and Rothera. Hobart and Indian departure ports are defined separately in the frontend. Data-source names USNIC, ERA5, HYCOM and AMSR2 are simulation labels in this implementation.

The frontend references Esri ocean tiles, externally hosted Leaflet CSS, and Google Fonts. The default API base is the Render URL embedded in `App.jsx`; its availability was not verified. There are no API credentials required by the current simulated backend. No first-party project license was found; vendor licenses apply to their respective bundled software.

## Failure behavior — updated 2026-09-14

A failed calculation shows a visible message and Retry. Previous route geometry, iceberg results and metrics clear when recalculation starts. Loading/empty telemetry and unavailable Analytics replace sample values until a usable response arrives. There is no frontend offline route simulation fallback.

A graph search that cannot find a route now produces an explicit no-route message. It does not substitute a straight-line route or display success metrics. Review endpoints and retry; this outcome reflects the modeled graph and does not establish real-world navigability.
