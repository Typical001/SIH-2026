# Current issues and limitations

Reconciled 27 September 2026 against source 5898e40. The complete old NAV register is preserved in the [archived issues](archive/before-2026-09-27-reconciliation/KNOWN_ISSUES.md); its historical status wording is not the present backlog.

## Remaining work

| Area | Limitation / follow-up |
|---|---|
| Model/data validity | Drift, SIC, currents, wind, burn, vessel limits and depth are estimates requiring measured calibration for operational use. |
| Coverage/search | Generalized land, 2022 shelves, dated large icebergs, offshore-only approaches and a finite graph cannot establish complete hazard/harbour safety. |
| Forecast coverage | Maximum 72 h; many voyages exceed it. Later conditions remain unknown and disclosed. |
| Fuel optimization | Each route's burn/reserve is calculated, but fuel alone does not cause a fuel-optimal search. All profiles can legitimately share feasibility status. |
| Recommendation precision | Feasibility uses unrounded burn; recommendations compare rounded returned exposure/time. Very close alternatives may tie. |
| Demo identity | One shared account; no individual registry, MFA, recovery, audit trail or government verification. Sessions/throttling are process-local. |
| Hosting/startup | Render sleeps/restarts; graph warm-up may exceed deadlines and sessions end on restart. Local script waits about 45 seconds and can time out on slow machines. |
| Cancellation/load | Browser abort suppresses stale results but does not guarantee interruption of backend calculations. Route calculations serialize. |
| CORS | Wildcard bearer CORS is active. ALLOWED_ORIGINS is parsed but unused. Tokens still protect application endpoints. |
| Map | OSM availability, polar latitude limits, overlapping icons/drift positions and finite repeated overlay copies remain. Test extreme pan/resize/date-line cases after map changes. |
| Google | GoogleEarthMap is inactive; saved key not used. Google-backed flat map remains unimplemented. |
| Historical key | Previously tracked Google key was removed from current tree; restriction/rotation and history remediation were not verified. |
| Old deployment paths | Dockerfile uses old Python and omits required sibling research. Vercel is not the supported frontend deployment. |
| Repository hygiene | Legacy engines/tests, prototypes, archives and bundled tools remain and can confuse broad discovery or inflate size. No cleanup was performed. |
| Verification | Deprecation warnings remain; no exhaustive browser matrix, sustained load/security audit or operational certification. |

Thickness, mass and orientation remain unavailable. Historical BYU advertised coverage differs from internal dates; archived rows are not automatically live observations.

## Resolved in the active implementation

| Concern | Current behavior |
|---|---|
| Invalid successful fallback | Complete segment/final checks; blocked searches 409 and unavailable required data 503; no unchecked fallback. |
| Map/routing mismatch | Shared 33-record snapshot and forecast; selected map envelope is routing geometry; BYU references labelled separately. |
| Disconnected controls | Forecast/buffer/class affect hazards/eligibility; speed/burn/reserve/fuel affect metrics. Horizon capped at 72 h. |
| Hardcoded fuel/recommendations | Per-route formulas plus reserve; only fuel-feasible profiles recommended. |
| Stale results | Input-owned requests, abort/late-response guards and route clearing. |
| Large forecast downloads | Compact summaries, lazy selected detail, bundled data, gzip and bounded caches. No provider calls. |
| Misleading source claims | Dated observations and calculated estimates labelled in UI/report; no live AIS/satellite guarantee. |
| Identical-looking profiles | Different time/exposure objectives, shared physical constraints and overlap labels; no artificial offsets. |
| Map/report overlap and detached routes | Isolated stacking, dedicated SVG routes and non-bubbling clicks; browser checks passed within recorded scope. |
| Repeated complete worlds on zoom-out | Viewport minimum zoom retains horizontal wrapping. Fixed noWrap/maxBounds remains removed; arbitrary extreme pans are not exhaustively verified. |
| Iceberg visibility | All 33 small static icons by default, locator, optional filters and selected drift/envelope. |
| Duplicate navbar PDF | Removed; report/sidebar export remains. |
| NAV-38 disconnected auth | CaptainLogin gates App, APIs verify bearer sessions, logout/expiry supported; old mock AuthContext is unmounted. |
| Public deployment | Netlify/Render live; login and default routes verified 27 Sep. |

Use [TESTING.md](TESTING.md) for evidence. Fixing demonstration defects does not remove model/data limits.
