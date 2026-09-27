# Project overview

Current as of 27 September 2026, source `5898e40`.

PolarNav demonstrates Antarctic passage planning with dated observations and calculated estimates. React 18/Vite/Tailwind provide the UI, Leaflet/OpenStreetMap the map, FastAPI/NetworkX/Shapely/pyproj the backend, and jsPDF the report. No trained machine-learning model is loaded.

The first page is Captain sign-in. The backend checks a provisioned account; there is no signup or displayed credential. Successful login mounts the dashboard and starts the default Cape Town–Bharati calculation. Logout hides the dashboard and revokes the session.

The dashboard has planning controls, three route cards, a centered rectangular dark map, nine layer switches and a voyage report. Expanded-map mode remains available. Navbar offers Voyage report, not a redundant Export PDF button; export remains in the report/sidebar. Five gateways and four Antarctic stations use offshore approach endpoints, not harbour-entry routes.

Safest minimizes ice-exposure hours, Fastest minimizes time, and Balanced minimizes time plus four times exposure. All share vessel, speed and buffer. Similar routes can be correct; overlap is reported rather than creating artificial detours. Fuel feasibility is computed per route including reserve.

All 33 small iceberg icons are enabled by default. Near route and Explore area filters are optional. Forecast rings/connectors appear at zoom 4+ or on selection; the locator loads detail. Horizontal wrapping supports continuous panning and a viewport-dependent minimum zoom limits repeated complete worlds. Web Mercator omits the exact poles. The active map does not use Google or its saved key.

USNIC observations are dated 24 September 2026; BYU positions are earlier references. Land is Natural Earth; shelves are USNIC 2022. Drift, sea ice, wind, currents, depth, fuel and vessel limits are labelled estimates. UI forecast range is 24–72 h; voyages can exceed it. Backend data is bundled; map tiles need internet.

The public frontend runs on Netlify and API on Render Free. Cold starts, finite compute and single-account authentication remain demo limitations. Public waypoints stay in browser storage. See [implementation](CURRENT_IMPLEMENTATION.md), [deployment](DEPLOYMENT.md) and [issues](KNOWN_ISSUES.md).
