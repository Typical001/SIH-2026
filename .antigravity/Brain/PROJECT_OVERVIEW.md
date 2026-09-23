# Project overview

Current as of **2026-09-19**, `main` at **2cc8271** (with Frontend Login System and PDF Export features). PolarNav addresses SIH-26059, Dynamic Route Optimization & Iceberg Movement Forecasting for Polar Navigation. The implemented product is a prototype decision-support dashboard, not a certified navigation system or a trained AI forecasting model.

## Implemented workflow

1. Unauthenticated visitors are presented with a mandatory, non-bypassable **Polar Command Authentication Gate** (`LoginModal.jsx` with `isMandatory={true}`). Access to the main dashboard, Leaflet map, route planning controls, and API route calculations is completely locked until valid officer sign-in or 1-Click Quick Demo Access (Capt. Alex Vance, Dr. Priya Sharma, Cmdr. Henrik Lind) is completed.
2. Once authenticated, select Bharati, Maitri or Casey. Presets depart Cape Town for Bharati/Maitri and Hobart for Casey; a searchable list of 13 Indian ports can override departure.
3. Select PC1, PC3, PC7 or Open Water Vessel and a 24/48/72-hour forecast. Settings automatically request a full route; Optimize Route and Run Forecast both recalculate that route.
4. The backend validates inputs, attempts an environmental fetch at departure, loads an iceberg catalog, projects drift and searches a directed geographic graph.
5. The map shows computed/baseline routes, current/predicted iceberg positions, trajectory trails, planning envelopes and optional illustrative ice circles. Markers, trails and buffers toggle independently. The metocean control is disabled because the frontend does not fetch a grid.
6. DecisionSupport and Analytics show returned metrics, baseline comparisons, sampled explanation factors, average forecast drift speeds, hazard intersections and forecast coverage gaps. Missing results remain empty; failed calculations show an alert and Retry.
7. Authenticated officers can view their profile, vessel assignment, and ice class badge in the Navbar dropdown, or click **Sign Out** to instantly lock command access.
8. Users can click **Export PDF** in DecisionSupport or **Export PDF Report** in the Analytics Modal to download an official 5-section bridge execution report powered by **PolarNav Engine**, populated with live calculated route metrics, waypoints, XAI factors, and Polar Code checklists.

Request cancellation and ownership guards suppress stale responses, including JSON parsing races. A one-second UTC display clock does not cause route requests. An offline banner reflects origin metadata.

## Technology and modules

| Layer | Implementation |
| --- | --- |
| UI | React 18.3.1, Vite 5.4.21, Tailwind, Lucide, Leaflet/React Leaflet, jsPDF 3.0.4, jspdf-autotable 5.0.2 |
| Auth & Session | `AuthContext.jsx` with `localStorage` persistence, 3 preset Quick Demo officer roles, and `LoginModal.jsx` glassmorphism modal |
| PDF Reporting | Client-side `pdfGenerator.js` utility exporting official 5-section bridge navigational plans with PolarNav Engine branding |
| API | FastAPI, Pydantic query constraints, Uvicorn; application endpoints including `POST /api/v1/auth/login` and `POST /api/v1/auth/signup` |
| Routing | NetworkX directed A*, Shapely land checks, shared spherical geometry |
| Drift | Hourly dead reckoning using weighted wind/current vectors and a fixed rotation |
| Data | requests-based Open-Meteo forecast/archive/marine and attempted NOAA iceberg feed; analytic fallback components with Open-Meteo circuit breaker |
| Persistence | Standard-library SQLite environmental and iceberg tables; 300-second process caches; client-side `localStorage` officer session |
| Tests | unittest/ASGI backend checks; Vitest 4.1.11 with React Test Renderer 18.3.1 |
| Hosting files | Python 3.10 Docker/Render backend and Vercel SPA frontend configuration |

## Data reality

- Wind normally attempts the Open-Meteo ECMWF IFS forecast; failure uses SQLite or raises a missing-cache error. The retained analytic wind helper is used for controlled tests, not the normal runtime fallback. Rate-limiting is handled with a 60s in-memory circuit breaker.
- Currents attempt Open-Meteo Marine and fall back to an analytic model. A HYCOM label in a string is not evidence of a direct HYCOM integration.
- Sea-ice concentration is always analytic; there is no measured AMSR2 ingestion.
- Icebergs attempt a NOAA GeoJSON URL, then fall back to 12 fixed examples. Persistence handles fallback seamlessly.
- The origin preflight's `is_offline`, source label and receipt time are copied to the route response, although downstream calculations independently refetch data and can mix sources.
- `backtest_date` is accepted by the API but unused. Forecast wind sampling ignores the supplied forecast hour and reads the first hourly value.

## Current route guarantees and limits

Input limits, complete edge/connector checks against the known polygons and conservative iceberg envelopes, exact endpoints, directed costs, consistent spherical baseline geometry, signed savings, PDF report generation, auth session persistence, and forecast-gap reporting are implemented. No-route returns 409 instead of invented success geometry. Open-water vessels reject sampled modeled ice.

The land mask remains incomplete. Polar Class weights are not operating limits; risk and fuel are illustrative models. Hazards cover the supplied trajectory conservatively rather than matching vessel arrival times. Many voyage durations exceed the forecast horizon. Therefore a successful route, LOW risk label or baseline comparison does not establish navigability.

The map uses EPSG:3857 and external Esri tiles; two circles are explicitly illustrative ice zones. The UI has no manual coordinate, speed, buffer or backtest-date input. API speed defaults to 14.5 knots and buffer to 25 km. Backend station metadata includes McMurdo south of the supported route latitude domain; it is not a selectable UI destination.

## Current quality status

Frontend build passes cleanly, frontend Vitest tests are **40/40 passing**, and controlled backend checks are **24/24 passing** with substituted providers. Live integration, offline completeness and provider workload remain unresolved. Prioritized fixes and acceptance criteria are in [KNOWN_ISSUES.md](KNOWN_ISSUES.md); evidence is in [TESTING.md](TESTING.md).
