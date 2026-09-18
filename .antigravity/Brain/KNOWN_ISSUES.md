# Known issues and proposed work

## Route-correctness checkpoint — 2026-09-18

- NAV-11/18: fixed input/workload bounds and identical-endpoint rejection (422), including direct engine guards.
- NAV-12/14: fixed directed costs, admissible A*, and consistent spherical baseline geometry/distance/collision checks.
- NAV-03: full-edge/connector checks now cover the existing polygons and forecast envelopes. Complete, sourced coastlines remain unresolved; no claim of global land avoidance.
- NAV-04/20: removed forced-positive savings and LOW risk cap; both routes use one explicit speed-dependent fuel model. Risk/fuel calibration and operational validity remain unresolved.
- NAV-13: conservatively avoids the entire supplied drift trajectory; displays forecast gaps. Arrival-time-aware routing and long-horizon forecasts remain unresolved.
- NAV-19: open-water vessels reject sampled modeled ice. Certified Polar Class operating limits and ice-type/thickness constraints remain unresolved.
- NAV-25: endpoints and sampled explanations now use actual model node factors and include the final node. Explanations remain heuristic summaries, not validated causal traces.

Earlier entries below are historical where superseded. UI and routing regression results are in TESTING.md.

## Current UI checkpoint — 2026-09-18

Baseline is now `6d1f221`, which contains the earlier NAV-01/02/06/24 restoration. Local UI changes resolve the following findings from the historical register below:

- NAV-05: map/report identify simulation and unverified clearance; unsupported safety/compliance and live-provider claims removed from the mounted UI.
- NAV-07: unavailable metocean checkbox disabled and labeled; fixed ice circles explicitly described as illustrative, not a measured grid.
- NAV-08: selector, chart, legend and forecast popups use the selected 24/48/72-hour horizon. Legacy backend field name remains unchanged for compatibility.
- NAV-09: departure and destination names/coordinates derive from current selections, including Indian ports and Hobart/Casey.
- NAV-10: removed invented comparison figures, weather alerts and alert ages. Zeros remain zero; missing baseline metrics are unavailable. Duration rounding carries into days. Missing chart samples leave gaps rather than zero-speed points.
- NAV-15: risk states and checkboxes use literal Tailwind classes, verified in the built stylesheet.
- NAV-22/23: markers, buffers and trails render independently; trails preserve supplied intermediate trajectory points.
- NAV-27 visible actions: Planner/Forecast navigate to controls; Analytics opens its report; Dashboard/team are static labels and View All is removed. Unused component/prop cleanup remains.

NAV-16 projection labeling and NAV-26 origin/destination labeling are corrected; missing speed/buffer/manual-coordinate controls remain open. Backend route correctness, risk/fuel models, scientific validation and real data integration are unchanged. See TESTING.md for current evidence.

## Historical register — 2026-09-17 (superseded above where noted)

Updated **2026-09-17** against `3684d67` plus local repairs. Register: **27 entries, 22 open, 4 fixed locally (NAV-01/02/06/24), 1 retired (NAV-21)**. The three regressions and their test infrastructure are restored without reverting the new layout. Priorities are proposed engineering order, not evidence of operational certification.

`6097e6c` committed the earlier fixes; `c996de7` removed them during the redesign. `dccfa3b` restored documentation/tests only. Current evidence is separated from historical checks in [TESTING.md](TESTING.md).

| ID / priority / status | Evidence and impact | Proposed completion criterion |
| --- | --- | --- |
| NAV-01 / Fixed locally | Restored scalar dependencies, AbortController, cleanup and stale-result/error/loading ownership. The one-second clock no longer drives fetches. | Component tests pass for clock ticks, settings, equivalent coordinates, manual refresh, JSON races, stale responses/errors and unmount/remount. Browser StrictMode replay not directly tested. |
| NAV-02 / Fixed locally | Restored NoRouteFoundError and HTTP 409 / NO_ROUTE_FOUND. No synthetic fallback geometry, metrics or explanation is returned. Successful XAI payloads are retained. | All five engine/ASGI tests pass, including blocked/disconnected/missing graph endpoints and successful route/explanation responses; frontend no-route recovery tests pass. |
| NAV-03 / High / Open | Routing excludes unsafe grid points but does not validate the segments between them or endpoint connectors. LandMask covers only simplified Indian-region polygons. | Validate every segment against full applicable coastlines and hazards; test thin barriers, endpoint hazards and out-of-domain ports. |
| NAV-04 / High / Open | Fuel savings are floored at 4.5%; risk is capped at 28, so backend risk labels always stay LOW. | Report signed model-derived savings and validated risk measures; include cases with negative savings and high risk. |
| NAV-05 / High / Open | Data remains synthetic. Footer now marks SIMULATION, uses UTC for its clock and reports result availability; this portion is repaired. Map/report still claim 100% clearance. Old Navbar feed badges were removed, but these claims remain unsupported. | Mark simulation mode, distinguish a clock from data freshness, and derive online/safety statements from verified results. |
| NAV-06 / Fixed locally | Results and explanations clear on recalculation. DecisionSupport and Analytics show loading/empty states; sample metric fixture removed; accessible alert/Retry and minimal response guards restored. Navbar no longer claims fallback and footer reflects result availability. | Tests cover outage, HTTP/JSON/missing/partial data errors, retry, stale suppression and clearing chart/explanation/alerts. Nested schemas are not exhaustively validated. |
| NAV-07 / Medium / Open | Metocean now has a visible checkbox, but metoceanGrid remains empty and no fetch populates it. SIC remains two fixed circles. | Fetch bounded metocean data and render consistent layers, or label/remove unavailable controls. |
| NAV-08 / High / Open | API fields and map/report text retain 72h. New selector sends 24 hours labeled Next 24 Days, 48 hours labeled Next 48 Hours, and 72 hours labeled Next 7 Days. | Correct labels and consistently propagate actual forecast hours; verify all three UI selections plus API boundary horizons. |
| NAV-09 / Medium / Open | Origin/destination popup text is fixed to Cape Town/Bharati even when coordinates change. | Derive names and coordinates from selected route context; cover Indian ports and Hobart/Casey. |
| NAV-10 / Medium / Open | Analytics keeps fixed baseline fuel/time/risk and length-or-3 collision count. New DecisionSupport labels route distance times 1.05 as Shortest and adds 12 to the hour remainder without carrying days. Weather alert, location and alert ages are hardcoded. | Use backend-derived comparisons and real alert evidence; preserve zeros, handle day rollover and show unavailable values honestly. |
| NAV-11 / Medium / Open | Route coordinates lack geographic/domain constraints; metocean steps and sample size lack bounds. | Reject invalid coordinates, zero/negative steps, reversed bounds and oversized requests with validation errors. |
| NAV-12 / Medium / Open | Graph is undirected although current effects are directional; adding reverse edges overwrites weight. Haversine heuristic can overestimate edges discounted below pure distance. | Model directed costs and use an admissible heuristic; compare A* against Dijkstra on representative grids. |
| NAV-13 / Medium / Open | Hazard avoidance uses final predicted positions only, without vessel arrival time. Voyage estimates can exceed the forecast horizon. | Align moving hazards to timed voyage segments and surface coverage gaps. |
| NAV-14 / Medium / Open | Baseline display uses linearly interpolated lat/lon while baseline distance uses a great-circle calculation. | Use consistent geodesic geometry for rendering, collision tests and distance. |
| NAV-15 / Low / Open | Dynamic Tailwind classes remain in LeftControls and DecisionSupport. The September 17 built CSS lacks all three dynamic safety background selectors and emerald/amber safety-border selectors; cyan layer selectors exist through other literal uses. | Use explicit class maps/safelist and inspect generated styles for each risk state. |
| NAV-16 / Low / Open | PolarMap remains default EPSG:3857 with unused projection packages and a polar label. Speed state/callback still has no rendered input. | Align projection/feature labels or implement and validate the missing functionality. |
| NAV-17 / Medium / Open | Wildcard CORS, no rate limit, minimum-only Python dependencies, generated bytecode and bundled tools remain tracked. New Python 3.13 cache files replaced 3.14 files; response.json is an unused sample missing XAI. Test dependencies are now declared/locked; reproducible isolated installs and general dependency hygiene remain to be checked. | Bound workloads, define deployment policy, reproduce clean installs, and deliberately remove tracked generated artifacts; ignore rules alone do not untrack files. |
| NAV-18 / High / Open | Identical endpoints divide by zero in baseline fuel. Reproduced again September 17 at (-50, 40) with no iceberg forecasts: ZeroDivisionError. | Return a documented zero-distance outcome or validation error; verify engine and API do not crash. |
| NAV-19 / High / Open | Vessel class changes sea-ice cost but never prohibits unsuitable ice. An Open Water Vessel route from (-68, 40) to (-69, 41), with no iceberg forecasts, returned `OPTIMAL_ROUTE_COMPUTED` and 80.3% maximum sampled SIC. | Define and enforce vessel-specific operating constraints; return no suitable route when all paths violate them and test each supported class. |
| NAV-20 / Medium / Open | Daily fuel burn is fixed at 36.5 tons regardless of cruising speed. On a route from (-50, 40) to (-51, 41), with no iceberg forecasts, increasing speed from 10 to 20 knots reduced modeled fuel from 10.8 to 5.4 tons solely by reducing voyage time. This is distinct from NAV-04's savings floor. | Use a documented, validated speed-dependent fuel model and verify consumption across supported speeds and ice conditions. |
| NAV-21 / Retired / UI removed | Old ControlDeck manual-coordinate clearing defect is no longer reachable because those fields were deleted in c996de7. This is removal of a capability, not a repaired reset workflow; see NAV-26. | If manual origins return, test draft versus applied coordinates and an explicit reset. |
| NAV-22 / Medium / Open | `PolarMap.jsx` nests hazard buffers and drift trails inside `showPredictedBergs`. Hiding predicted markers also hides these layers even when their own toggles remain enabled. | Render markers, hazard buffers and drift trails independently; verify each toggle combination matches the visible layers. |
| NAV-23 / Medium / Open | `PolarMap.jsx` draws drift trails using only initial and final positions, ignoring the backend's hourly `trajectory_points`. Intermediate trajectory curvature is lost. | Render the supplied trajectory points in time order and verify a curved forecast remains curved on the map. |
| NAV-24 / Fixed locally | Restored npm test with pinned Vitest 4.1.11 and React Test Renderer 18.3.1, installed/locked dependencies, updated panel mocks and numeric fixtures. Backend exception import restored. | Twenty frontend cases and eight backend checks pass. Tests use actual Navbar/DecisionSupport/Analytics/footer, mock controls/map/network and preserve earlier behavioral assertions. |
| NAV-25 / Medium / Open | XAI is heuristic post-processing, not a cost trace. Endpoint SIC is forced to 0/0.8; missing graph attributes default to 0/1, on successful routes. Failed routes now return no explanation. Short open-water probe reported destination SIC 0.8 while route maximum SIC was 0.0. Proximity flag is not actual graph penalty. | Derive factors from actual node/edge evidence, mark unavailable data, distinguish summaries from causal explanations and retain the restored suppression of success explanations when no route exists. |
| NAV-26 / Medium / Open | Manual origin inputs, safety-buffer slider and fine-grained forecast slider were removed. Buffer stays 25 km, speed 14.5 knots. Preset origin is active while From is blank; To displays a full preset route even with an Indian-port override. | Agree the intended controls, restore required inputs, and show actual origin/destination/horizon without ambiguous labels. |
| NAV-27 / Low / Open | Dashboard, Route Planner, Forecast, profile and View All buttons lack actions. Navbar receives but does not use onRefresh. StatusBar.jsx is unused beside the mounted BottomStatusBar. | Wire supported actions or remove/disable placeholders; remove unused component only after review. |

## Evidence boundaries and history

- Before restoration on September 17: source review/build/three original checks succeeded, while no-route import and npm test failed. After restoration: 3 original checks, 5 no-route tests and 20 component cases pass; production build passes.
- The pre-restoration in-process ASGI probe used (-34,18) to (-35,19), zero-hour horizon, empty iceberg catalog, and LandMask.is_land patched true. It returned HTTP 200, 25 waypoints and LOW risk; the restored all-land regression test now verifies HTTP 409 with no success data. A corresponding all-water probe returned 3 waypoints and exposed the artificial destination SIC in XAI.
- Identical endpoints were reprobed directly in the engine. NAV-19 and NAV-20 numeric examples remain September 14 diagnostic evidence; their underlying formulas are unchanged, but those cases were not rerun here.
- Unresolved UI findings remain source-based (and selected CSS inspected); restored lifecycle/result behaviors also have passing component coverage. No browser session or hosted endpoint was exercised.
- Hand-entered coastline polygons still lack a bundled source dataset or reproducible extraction procedure. The wind function still describes northward outflow while assigning a negative northward component. Both require model validation.

## Suggested delivery sequence

1. Retain the passing NAV-01/02/06/24 regressions. Next correct horizon labels and the remaining unsupported safety claims (NAV-05/08).
2. Address zero-distance input, segment/coastline checks, vessel limits, directional search costs, timed hazards and credible metrics (NAV-03/04/11–14/18–20).
3. Validate XAI and comparisons; complete controls, layers, trajectory rendering and actions (NAV-07/09/10/15/16/22/23/25–27).
4. Integrate real providers with provenance, freshness, outage behavior and forecast validation, then harden deployment and repository hygiene (NAV-17).
