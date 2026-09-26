# Current issue status — 26 September 2026

## Centered map follow-up — 26 September 2026

This checkpoint supersedes the earlier full-window default and low-zoom repetition notes. The app now opens with planning panels and a bordered rectangular map. Horizontal wrapping/worldCopyJump remain enabled, with no fixed longitude bounds. ResizeObserver sets minimum zoom to ceil(10 × log2(max(viewport width, height) / 256)) / 10, so the viewport never spans multiple complete worlds. World view respects this limit; on wide screens it is an overview, not a guarantee that both poles fit vertically. Fit route restores the selected passage.

SVG route and endpoint copies at longitude offsets -360/0/+360 stay aligned across the date line. Reference/estimated polygon layers and iceberg positions also account for display wrapping; route-corridor filtering normalizes continuous backend longitudes. Renderer teardown belongs to Leaflet, preventing React effect refresh from detaching live SVG paths. The report stacking fix remains active.

Validation: 31 frontend tests across 6 files; desktop default and Hobart–McMurdo route fitting, world-seam pan, all optional layers enabled with visible routes, report open/close, and no alert observed. Backend routing was unchanged. See TESTING.md for the current verification scope.


The nine requested demo issues have been addressed in the active observation-backed runtime. The old NAV register is retained below as historical evidence, not current status. See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for implementation boundaries and assumptions.

| Requested issue | Current resolution |
|---|---|
| 1. Routes cross obstacles / fallback success | Complete segment and final-output validation against bundled land, shelf and estimated swept iceberg envelopes. HTTP 409 for blocked searches; no successful fallback. |
| 2. Map/routing disagree | Shared versioned 33-iceberg snapshot and forecast formulas; selected map envelope comes from routing geometry. Earlier BYU reference observations are labelled separately. |
| 3. Ineffective controls | Horizon/buffer affect hazards; vessel class gates estimated SIC; speed/burn/reserve/fuel affect metrics and feasibility. All 5 gateways and 4 stations retained. |
| 4. Inconsistent metrics/recommendations | Documented distance/time/burn/exposure formulas. Only routes meeting burn plus reserve are recommended. Direct baseline is calculated and labelled hypothetical when obstructed. |
| 5. Vessel restrictions not enforced | Explicit planning limits checked along edges, including terminal connections. PC3/PC5 McMurdo regression demonstrates different availability. Rules are not presented as IMO certification. |
| 6. Stale results | Input changes clear routes before repaint; obsolete requests abort; late responses are rejected. API returns input hash and dataset ID. |
| 7. Excessive data/network work | Local data and local base map; no runtime provider calls. Default iceberg response 25,342 bytes in measured HTTP check; trajectories fetched on selection. Single-build graph cache and startup warm-up. |
| 8. Misleading live/verified claims | Observation dates and estimate labels persist in UI and PDFs. No live satellite/AIS or 100% collision-free claims. Generated fixture icebergs are not loaded. |
| 9. Startup/reset/testing | Setup/start/stop scripts, versioned browser inputs, explicit waypoint persistence, deliberate reset and current acceptance tests. |

## Known limitations still relevant

Route-profile similarity fixed on 26 September: broader ocean search, distinct time/exposure objectives, shared vessel speed and safety buffer, and explicit overlap reporting. The former profile speed multipliers and distance/ice-penalty objectives are retired. Similar routes remain legitimate when the objectives choose the same corridor; the UI labels that result. Sea-ice, wind and current estimates remain latitude-based assumptions, and the finite graph can still miss passages outside its nodes.

- Detailed worldwide map tiles require internet and depend on OpenStreetMap availability. Bundled coastline fallback and routing remain local. Web Mercator does not display the exact poles (tile latitude limit about ±85.05°). There are no Antarctic-only pan bounds; the full-window map supports worldwide exploration and street-level zoom.
- GoogleEarthMap.jsx is an inactive prototype, with no active opt-in toggle. OpenStreetMap supplies the current visual basemap. The saved Google key is not used; the earlier request for Google data in the flat map remains unimplemented.
- Low-zoom world repetition remains open. The noWrap/maxBounds experiment was reverted at the user's request because routes appeared outside the map. Horizontal tile wrapping, worldCopyJump and the earlier minimum zoom behavior are restored. Default Fit route was verified after the revert; all dateline routes were not browser-retested.
- Startup can briefly expose a frontend request error before backend graph warm-up completes. Wait for the start script readiness message and refresh; this UI startup race has not been repaired by the map work.

Map visibility repairs on 26 September cover dark water styling, cramped narrow-screen layout, hidden forecast endpoints, coastline retry and report stacking. Canvas markers show reported and estimated positions together; routes use an independent SVG pane. Algorithms are reported per profile: lexicographic Dijkstra for Safest and A* with zero heuristic for Balanced/Fastest. Small drift displacements naturally overlap at overview zoom; use the iceberg locator for detail. The original intermittent disappearing-route report was not reproduced before the SVG change; post-change pan/click/zoom checks passed in the in-app browser.

- Forecasts, environment, bathymetry proxy, fuel and vessel limits are calculated planning assumptions, not validated measurements. The user explicitly authorized estimates for missing data.
- Generalized land, 2022 shelf boundaries and a dated large-iceberg catalog cannot establish operational safety or complete hazard coverage.
- Offshore approach points exclude harbour/shore-transfer legs. A bounded graph can fail even if a path exists outside it.
- Voyage duration can exceed forecast coverage; later conditions remain unknown and this is disclosed.
- Source thickness, mass and orientation are unavailable. No invented observed values fill these fields.
- The BYU historical archive and its website disagree about date coverage; historical files are preserved for research, not bulk-loaded into current routing.
- Older backend tests target the retired engines. Run the current acceptance suite documented in TESTING.md. Dev tooling emits non-failing Vite/plugin and Starlette/httpx deprecation warnings.
- Local demo startup binds to loopback. Authentication and public deployment hardening are not part of this local demonstration.

## Historical issue register — superseded

The following text records earlier findings and intermediate fixes. Its “open,” “regressed,” “current” and “pending” wording refers to the historical date, not the implementation above.

# Known issues and proposed work

## Demo direction and fix 01 — 2026-09-25

**Latest update:** offshore approach points are now automatic for all preset
locations. [DEMO_PRESETS.md](DEMO_PRESETS.md) supersedes the pending-choice notes
below. All 20 gateway/station pairs return three geometry-validated demo routes.
Preset calculations and the main iceberg endpoint share local fixtures; full
auxiliary-layer conversion, vessel/metric calibration and report claims remain open.

Follow-up: prolonged route spinner fixed with early land-endpoint rejection,
bounded graph preparation, a 30-second route request deadline, and independent
iceberg overlay fetching. Regression checks: 12 backend and 17 frontend passed.
Land-based port/station coordinates still require the pending offshore-point choice.

The user now wants a working simulated-data demo, retaining all five gateways and four stations. Live-provider repairs are not demo blockers once runtime dependencies are removed (still pending). See [DEMO_FIX_01.md](DEMO_FIX_01.md) for the current implementation and remaining decision.

- NAV-02: fixed for successful route geometry: no-path returns 409; compute/forecast failures return 503 without routes. No unchecked geometric fallback is served.
- NAV-03: segment, terminal and final-output checks now use bundled global Natural Earth land data and supplied forecast buffers. All-port demo completion remains pending offshore approach-point selection and scenario validation.
- NAV-06: prior results now clear during recalculation/failure. Full immutable report/input identity remains pending.
- NAV-37: pyproj is now declared; pyshp is declared for the bundled coastline reader.
- NAV-47: southern grid now extends to -85; exact land-based endpoints are rejected. Offshore approach-point decision remains pending.
- Older rows below are the 2026-09-24 audit baseline; the updates above supersede those specific claims. Other demo issues remain open.

Reviewed **2026-09-24**, code baseline **8bb44ea**. These are engineering findings in the current prototype. “Fixed” requires current evidence; prior fixes may have regressed. See [AUDIT_2026-09-24.md](AUDIT_2026-09-24.md) and [TESTING.md](TESTING.md) for verification conditions.

**ID reconciliation:** the previous document assigned NAV-28/29 twice, with contradictory statuses. NAV-28 remains iceberg persistence and NAV-29 remains the legacy environmental-cache finding. Authentication is now NAV-38; current layer/cache defects are NAV-28/32. No historical ID has been silently reassigned.

## Fix first

| Priority | IDs | Reason |
| --- | --- | --- |
| Critical correctness | NAV-02/03/11/13/39/41/47 | Unchecked/fabricated paths, invalid inputs, missing hazards, mismatched planning settings and unsupported destination coverage |
| High | NAV-37 | Backend fails to import without an undeclared dependency |
| High | NAV-04/05/06/10/20/32/35/40/44 | Misleading risk/fuel/live labels, stale results and unsupported PDF assertions |
| High | NAV-28/36/38/42/45/48/49 | Cache/catalog inconsistency, ingestion gaps, disconnected auth, reset vessel position, HTML injection, persistence and verification gaps |

Critical means a result can appear navigable without valid route checks; it is not a claim that this prototype is in operational use.

## Existing findings NAV-01–36

| ID | Current status / priority | Evidence and required completion |
| --- | --- | --- |
| NAV-01 | Partial / Medium | App scalar dependencies and abort ownership remain, but activeRouteType is a fetchRoute dependency and profile selection recalculates all profiles/auxiliary layers. Separate local profile selection from network work; isolate health/overlay ownership. |
| NAV-02 | Regressed / Critical | pathfinder.py:560–593 substitutes geometric paths after failed searches; main.py:516–562 converts compute exceptions into three BALANCED straight lines with zero metrics and FEASIBLE. All-land fixture returned three routes. Fail closed or return explicitly non-navigable diagnostic geometry; validate every returned segment. |
| NAV-03 | Regressed / Critical | Both engines use node-only land/hazard checks; _connect_terminal inserts clear endpoints and unchecked edges. Stage 1 is unchecked interpolation. Five coarse land polygons omit Antarctica/global coastline. Restore segment/connector checks and suitable coastline coverage across every stage and fallback. |
| NAV-04 | Regressed / High | Legacy savings have a 4.5% floor and risk a 28 cap; App substitutes 14.2% savings and profile-based risk. Use measured baseline/exposure, preserve negative/zero/missing values, and disclose calibration. |
| NAV-05 | Open / High | Health infers ECMWF validity from USNIC; layer helpers mark analytic fields live; Navbar defaults to live strings. Carry observed/cached/modeled/unavailable provenance through response and display. |
| NAV-06 | Regressed / High | App fetchRoute neither clears nor scopes prior metrics/geometry at start/failure. Old routes can survive new settings and be exported. Keep an immutable result/settings identity, explicit stale/empty states and export gating. |
| NAV-07 | Regressed / Medium | Active metocean controls display modeled overlays under provider names; “POLARIS Risk Heatmap” is hazard circles and fixed ice circles look observational. Label models and implement the claimed layer or rename it. |
| NAV-08 | Regressed / Medium | Control horizon spans 24–168 hours but map popup/trail labels retain +72h. Planner also stays at 72h (NAV-39). Use response horizon consistently. |
| NAV-09 | Partial / Medium | Current gateway/station labels exist, but baseline popup unconditionally claims iceberg intersections and map labeling still claims optimal safety. The GPS readout also appends fixed S/E suffixes to signed coordinates. Derive statements from validated result geometry. |
| NAV-10 | Regressed / High | App assigns fixed risk/collision/savings; TelemetrySidebar uses sample burns 142/117.9/103.7 MT and static weather/current values. SIC fraction is passed as percent. Bind measured values, correct units, and show unavailable when absent. |
| NAV-11 | Regressed / Critical | Request model accepts lat/lon=999, PC99 and invalid modes. Metocean step=0 raises ZeroDivisionError; graph/grid allocation has no size cap. Validate finite bounds, enum values, coordinate pairs, supported domain, fuel consistency and total workload before providers/allocation. |
| NAV-12 | Regressed / High | _build_graph and legacy graph use nx.Graph; opposite current costs overwrite a shared edge. Heuristic lower-bound guarantees are absent, including discounted legacy costs. Restore directed edges and prove/test search cost bounds against a reference solver. |
| NAV-13 | Regressed / Critical | Hazard polygons use final predicted centers, not swept trajectories or vessel arrival times. Forecast failures silently pass []. No voyage-horizon coverage metadata. Preserve full trajectory uncertainty and reject unavailable hazards. |
| NAV-14 | Regressed / Medium | Legacy baseline uses linear lat/lon samples but spherical endpoint distance; active map draws two endpoints and labels a great circle. Use a shared sampled spherical baseline and segment collision checks. |
| NAV-15 | Partial / Low | Earlier literal risk classes remain in inactive panels; active sidebar has w-84/md:w-88 without configured spacing. Current visible suite is not green. Verify styles on active components, then browser layout. |
| NAV-16 | Regressed labeling / Medium | Map remains EPSG:3857 but says EPSG:3857/Polar; routing comments say stereographic while grids use degrees. pyproj transformers are unused. Implement projection-aware geometry or label the actual system. |
| NAV-17 | Partial / Medium | npm lock/test tooling exists, but no first-party CI, Python lock, Docker ignore or complete runtime dependency manifest. Docker COPY includes the backend tree, including local environments/database when present. Reproducible clean installs and scoped packaging required. |
| NAV-18 | Regressed / High | Equal endpoints are no longer rejected; legacy fuel-savings division uses a zero direct-fuel denominator. Validate endpoint separation before model work and test both API families. |
| NAV-19 | Regressed / High | Legacy Open Water behavior is only a cost penalty; three-profile UI class is incorrectly mapped and hard RIO threshold cannot fire (NAV-41). Define and enforce validated vessel operating restrictions. |
| NAV-20 | Regressed / High | Fuel scales nominal burn by 0.180 and applies profile multipliers even to identical paths. ETA/fuel ice-speed reductions differ; reserve assumption is described as mandatory without supporting implementation evidence. Calibrate against vessel data and compute from geometry/conditions consistently. |
| NAV-21 | Original defect retired / Medium follow-up | New manual-entry control commits on blur or Set and permits clearing drafts, so old cleared-input coercion is not the same active defect. New parsing accepts unbounded values; tracked under NAV-11. |
| NAV-22 | Partly improved / Medium | Official iceberg display now renders only selected-item buffers, independently controlled by the risk layer. Backend hazards remain separate and require end-to-end validation. |
| NAV-23 | Partly improved / Medium | App joins compact predictions to detailed forecasts and selected icebergs can use hourly trajectory points. Backend forecast coverage and arrival-time validity remain open under NAV-13. |
| NAV-24 | Old fixture superseded; verification claim stale | App tests now use substring URL matching instead of the old URL-parsing fixture. Current suite is 14/23 passing, not 40/40. Broader active-component/test contract drift is NAV-49. |
| NAV-25 | Regressed / Medium | Legacy response no longer provides XAI; active dashboard/PDF use generic explanation/profile labels. Bind explanations to actual decisions and expose uncertainty. |
| NAV-26 | Feature restored, integration partial / Medium | Manual coordinates and buffer inputs are present again. Coordinates lack bounds and buffer is not honored by three-profile route planning (NAV-11/39). |
| NAV-27 | Implemented, correctness open / High | PDF export is connected in three active locations. Existence of export does not validate its assertions; see NAV-44. |
| NAV-28 | Partial / High | json import and SQLite layer writes exist. On outage fetch_live_usnic_icebergs returns cached GeoJSON but static Iceberg objects for forecasting/routing. Probe: CACHED-ONLY map catalog vs IB-A23A route catalog. Reconstruct one validated catalog from cache and share it. |
| NAV-29 | Legacy-only / Medium | database.py still allows unbounded-age/regional/global environmental fallback, but production no longer imports it. Do not describe this helper as the current route cache. Retire it or repair bounds before reuse; reconcile schemas with NAV-48. |
| NAV-30 | Partly improved / High | Per-grid-node network fanout is replaced by five corridor samples, each wind then marine. No total request/allocation budget; repeated UI/health/catalog calls and concurrent identical misses remain. Add shared snapshots, bounded acquisition and end-to-end budgets. Previous 50,000/10,000 grid caps and 300-second TTL claims are obsolete. |
| NAV-31 | Changed; time alignment open / High | backtest_date/archive path is removed. Cached provider values still use hourly[0], no observation/forecast time key or TTL, and ignore time_hours. Validate timestamps/units and select time-aligned fields; document backtesting as absent. |
| NAV-32 | Open / High | Three modeled layer helpers report live with all provider requests disabled; {} marine 200 is cached as zero SIC/current. Route label depends only on USNIC. Cache is_live survives outage and layer/status does not check age; bathymetry assumed live. Validate data/units and propagate per-input freshness/provenance. |
| NAV-33 | Changed / High | Previous demo/live gate, INITIAL_SYNC_REQUIRED preflight and rate-limit circuit are absent. Errors range from 409 with different keys to unchecked 500 or fabricated 200. Define a common error/degraded-data contract and test outage paths. |
| NAV-34 | Open / Medium | Vercel rewrites /api to SPA without a proxy unless VITE_API_URL is configured. Render/Docker have no persistent database setup. Verify split-host API routing and durable storage after dependency repair. |
| NAV-35 | Regressed / High | Health/auxiliary requests lack ownership/cancellation and retain prior values on error; route results also persist. Delayed old responses can overwrite newer origin layers. Scope results by request/settings/time and make stale state explicit. |
| NAV-36 | Partial / High | USNIC parsing handles Point/property coordinates and skips (0,0), but lacks complete finite/range/schema/unit/time validation and invents dimensions/confidence/date defaults. External contract remains unverified. Add representative fixtures and reject invalid records. |

## New findings NAV-37–49

| ID / priority | Finding and evidence | Completion criteria |
| --- | --- | --- |
| NAV-37 / High | pathfinder.py:22 imports pyproj, absent from requirements.txt and both inspected configured environments. Direct import raises ModuleNotFoundError. Render/Docker use that manifest. | Declare required runtime dependency or remove unused import/transformers; verify a clean manifest-only environment starts. |
| NAV-38 / High | main.jsx/App.jsx do not mount AuthProvider/LoginModal; main.py has no auth routes. Retained AuthContext ignores passwords and makes local mock tokens. Previous mandatory-login claim is false. | Decide demo vs real auth; wire a clear demo flow or implement server-verified authentication/authorization and test access boundaries. |
| NAV-39 / Critical | App sends forecast/buffer only to /icebergs; calculate-route schema omits them and main.py fixes routing at 72h/15km. Displayed hazards can disagree with planned clearance. | One validated planning-settings contract used by route, overlays, metadata and PDF; test changing both inputs. |
| NAV-40 / High | pathfinder.py:610–619 recommends BALANCED and adds FEASIBLE_BUNKER_CORRIDOR whenever SAFEST is unreachable, without checking BALANCED. Zero-fuel fixture marks all three UNREACHABLE yet recommends BALANCED. Sidebar separately blocks SAFEST below hardcoded 142 MT even for shorter routes; polylines can bypass card gating. | Recommend only a suitably feasible route, handle none-feasible explicitly, remove sample thresholds and unify selection gating. |
| NAV-41 / Critical | get_polaris_rio uses one constant per class. PC3 RIO=3 at SIC 0, .5 and 1; Open Water Vessel maps to PC7 (RIO .5 at full ice); minimum table value -8 cannot cross hard wall <-10. | Correct class identity, implement and validate an appropriate ice-regime/vessel model and demonstrate restrictions actually trigger. |
| NAV-42 / High | init_edge_db overwrites default vessel position at import with fresh time and is_fallback_seed=False. Probe saved (-66,80), initialization restored (-64.5,72). Unknown IMO returns a seed. App coordinate overrides bypass update_vessel_fix. | Seed only absent rows; distinguish observation and seed times; retain vessel identity, persist intended fixes and label simulated GPS honestly. |
| NAV-43 / Medium | SAR query filters product name only, takes ten without region/date/order, and labels acquisition footprints as high-backscatter detections. Seeded footprints also show LIVE SAR in popups. | Filter relevant coverage/time, label acquisition footprints/fallbacks, and require actual detection processing before detection claims. |
| NAV-44 / High | pdfGenerator.js unconditionally checks certificate, egress and SAR statements; hardcodes RV Bharati/directed algorithm/25km buffer; inherits fabricated risk and wrong SIC percent. It omits fallback/fuel status and silently samples/renumbers waypoints. App can export old geometry with new settings. | Export a result-bound prototype report, verified/unknown check states, actual vessel/settings/provenance/feasibility, explicit waypoint completeness and precision; verify rendered output. |
| NAV-45 / High | PolarMap.jsx:309 interpolates external SAR name/content_date into Leaflet bindPopup HTML without escaping. Provider/cache strings reach an HTML sink. No exploit was executed. | Use text/DOM nodes or sanitize trusted markup; test literal rendering of malicious fixture strings. |
| NAV-46 / Medium | PolarMap GeoJSON keys are only feature counts (lines 207/298). Installed react-leaflet GeoJSON updater only updates style, not data. Same-count refreshes leave geometry/popups stale. | Replace layer data or use a version/content identity; test changed coordinates/properties with unchanged count. |
| NAV-47 / High | McMurdo (-77.846) is selectable but RiskTensor begins at -75. At default 0.8 degrees the terminal cannot reach the grid. Controlled no-land fixture returned geometric fallbacks for this destination. | Support the entire advertised domain with validated station approaches and test all gateway/station pairs, including dateline handling; reject unsupported requests explicitly. |
| NAV-48 / Medium | Three SQLite owners define divergent schemas; main.py and unused database.py disagree on iceberg_registry_cache columns. Writes swallow errors; runtime DB is tracked in Git. | One versioned schema/migration owner, observable persistence errors, explicit data path/storage policy and separation of runtime state from source. Preserve needed seed data through an intentional migration. |
| NAV-49 / High | Frontend has 9 failures; backend correctness suite cannot import removed InvalidRouteInput; legacy suites miss XAI/baseline fields. New verification scripts mostly print responses and do not establish safety. Existing App tests mock active children. | Restore meaningful active-contract tests, add adversarial three-profile/fallback/settings/provenance/PDF cases and CI. Separate provider smoke tests from deterministic engine tests. |

| NAV-50 / Medium | The full iceberg catalog is still fetched and retained in React; viewport filtering reduces rendered work but not network/payload/provider work. The display cap is 150 visible records. | Add server-side bounding-box/corridor parameters, pagination or vector tiles, and measure browser frame time and memory on representative catalogs. |
| NAV-51 / Low | Selected-only buffers and trails improve responsiveness but make unselected hazards less visually explicit. The route engine still receives its full catalog independently. | Keep a clear filtered-record count/legend and ensure route warnings communicate hazards that are not currently drawn. |

## Completion order

1. Repair startup and input/workload boundaries; stop success-shaped outputs for invalid/failed routes.
2. Restore end-to-end geographic/hazard validation and consistent planning settings.
3. Repair vessel restrictions, fuel recommendations and authoritative result/provenance state.
4. Correct PDF, cache/GPS, provider/map contracts and authentication expectations.
5. Restore deterministic regression coverage, then verify browser, provider and deployment behavior.

This audit updated documentation only. Findings remain open unless explicitly marked otherwise above.
# Map/report layout correction — 26 September 2026

Fixed Leaflet panes and controls painting above the planning report. The workspace and map now create isolated stacking contexts, the report overlay sits above the expanded workspace and map toggle, and the map flex item has a zero minimum width with clipped overflow. Browser verification at mobile and 1920px desktop widths confirmed the report is unobstructed; desktop map bounds stay inside the viewport and Fit route displays the route profiles. Production frontend build passed.
# Route persistence while navigating the map — 26 September 2026

Route profiles now use a dedicated SVG renderer and pane above environmental overlays, independently of the canvas renderers used for bulk observation layers. Route clicks no longer bubble into map coordinate selection. This addresses the reported disappearing route drawing; the original failure was not reproduced in the in-app browser before the change. After the change, all three route paths remained present through clicking and dragging. Frontend checks: 27 tests passed.
