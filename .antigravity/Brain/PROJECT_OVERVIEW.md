# Project overview

Reviewed 2026-09-17 at `dccfa3b`. See [CHANGELOG.md](CHANGELOG.md) for the September 17 redesign and regressions.

## Purpose and scope

PolarNav demonstrates how iceberg forecasts and environmental traversal costs influence expedition routes to Antarctic research stations. Intended demonstration users include planners, researchers and SIH evaluators; these are inferred use cases rather than a verified requirements specification.

There is no database, authentication, account management, persisted voyage history, real satellite ingestion, trained machine-learning model or scheduled data refresh service. The new “AI Route Explanation” is generated from deterministic conditions and sampled graph attributes, not an LLM or learned explanation model.

## Current capabilities and controls

| Area | Current implementation |
| --- | --- |
| Layout | Navbar, 256px left controls, central map, 256px decision-support sidebar and bottom status bar |
| Presets | Cape Town–Bharati, Cape Town–Maitri, Hobart–Casey |
| Origin | Searchable list of 13 Indian ports; clearing the selected port restores the preset origin |
| Vessel | PC1, PC3, PC7 and Open Water cost formulas |
| Forecast | Select values 24, 48 and 72 **hours**; labels incorrectly say “Next 24 Days”, “Next 48 Hours”, “Next 7 Days” |
| Safety buffer | State stays at 25 km; former buffer slider is absent; API accepts 5–100 km |
| Speed | State stays at 14.5 knots; no rendered control; API accepts 5–30 knots |
| Layers | Eight checkboxes, now including present icebergs and metocean; the latter has no data fetch |
| Map | Route/baseline lines, present/predicted markers, hazard circles, straight drift trails and two illustrative SIC circles |
| Decision support | Route summary, heuristic explanation and detail dialog, comparison, average drift-speed chart and alerts |
| Analytics | Existing comparison modal; missing-results guard was removed |

Manual latitude/longitude inputs and the 0–72-hour slider were removed with `ControlDeck.jsx`. The “From” search is blank when the preset origin is active, even though a Cape Town or Hobart origin is used. Selecting a preset does not clear a selected Indian-port override.

Only Analytics has a navigation-tab action. Dashboard, Route Planner, Forecast, user-profile and View All buttons have no implemented actions. `StatusBar.jsx` exists but is not mounted; App uses `panels/BottomStatusBar.jsx`.

## Demonstration workflow and actual request behavior

1. Start backend and frontend following [DEVELOPMENT.md](DEVELOPMENT.md).
2. Select a preset, optional Indian departure port and vessel class.
3. Select a horizon; interpret numeric values as hours despite incorrect labels.
4. Optimize Route or Run Forecast invokes the same full route endpoint; these are not separate calculation pipelines.
5. Inspect the map, explanation, speed chart and Analytics with the limitations below.

Parameter changes also trigger requests automatically. An unstable `currentCoords` object in `fetchRoute` dependencies retriggers the effect on rerenders. App's one-second clock adds periodic rerenders; loading/results changes can trigger further requests. There is no cancellation, stale-result guard or debounce. The request-loop regression was identified from source; browser request rates were not measured in this review.

## Failure and data integrity limitations

Starting a request does not clear old geometry, metrics or explanations. Failure sets an error string, but Navbar says “using local fallback” despite no local route-calculation implementation. DecisionSupport substitutes fixture metrics when metrics are absent. Analytics can display fixed claims with missing results. Malformed payloads receive no minimum usability validation; partial metric objects can fail numeric formatting.

Backend graph failure again produces a 25-point straight interpolation with success metrics rather than a 409 response. The selected route and displayed LOW risk therefore do not establish traversability. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Technology and dependencies

| Area | Stack / status |
| --- | --- |
| Frontend | React 18.3.1, React DOM, React Leaflet 4, Leaflet 1.9 |
| Styling | Tailwind CSS 3, PostCSS, Autoprefixer, Lucide React |
| Build | Vite 5; lock resolves Vite 5.4.21 and React plugin 4.7.0 |
| Testing | Restored 14-case component test file; npm test script, Vitest and React Test Renderer declarations/lock entries are absent |
| API | FastAPI, Uvicorn, Pydantic |
| Computation | NumPy, NetworkX, Shapely |
| Other declarations | SciPy, requests, proj4, proj4leaflet, clsx and tailwind-merge have no demonstrated runtime use in reviewed application source |

Python requirements use minimum versions without a lockfile. Existing local node_modules still includes the old testing packages, which does not make fresh installs reproducible or restore the test script. Bundled Node and Java editor extensions are support artifacts, not services.

## Data and external resources

The backend defines 12 static icebergs and six stations/ports: Cape Town, Bharati, Maitri, McMurdo, Casey and Rothera. Hobart and Indian ports are frontend constants. USNIC, ERA5, HYCOM and AMSR2 names describe simulated sources here.

The app references Esri ocean tiles, CDN Leaflet CSS and Google Fonts. The default API base is an embedded Render URL, not verified during this review. `backend/response.json` is a committed response sample with 76 waypoints and 12 icebergs; it lacks the new `xai_explanation` and is not read as an application fallback. No credentials are needed by the simulated backend. No first-party license was found.
