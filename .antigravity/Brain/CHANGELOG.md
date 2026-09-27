# Changelog

Current application source: 5898e40. Detailed historical records are preserved in the [archived changelog](archive/before-2026-09-27-reconciliation/CHANGELOG.md).

## 27 September 2026 — Complete Brain reconciliation (working tree)

Reconciled all 19 current Brain entries, archived their earlier text, refreshed Git history and corrected conflicting map, authentication, API-doc, deployment and test claims. No application behavior changed and this documentation pass has not been deployed. Four objective tests reran successfully; prior test/browser evidence retains its actual scope.

## 27 September 2026 — Captain login (5898e40)

Added CaptainLogin/auth.js, captain_auth.py and salted verifier; protected APIs, no signup, eight-hour opaque sessions, logout and throttling. Dashboard mounts after authentication. Added auth tests and authenticated route tests. Frontend 35, observation 14 and auth 3 tests passed; production build passed. Live login showed 33 observations/three routes; logout hid the dashboard; anonymous requests returned 401.

## 27 September 2026 — Public hosting (a4bdfe3, 50396ad, 816e9c9)

Configured Netlify and Render Free, pinned deployment dependencies, API origin, browser-local public waypoints, bounded caches/concurrency and longer cold-start deadlines. CORS follow-ups ended in wildcard-origin middleware compatible with bearer requests. See DEPLOYMENT for final configuration rather than intermediate intent.

## 26 September 2026 — Observation-backed planner and UI (f96cf8f, ae72b7f)

Broad checkpoints contain source datasets, calculated estimates, routing objectives/tests and successive UI work; titles alone do not map individual features to commits.

Current result: Safest lexicographic Dijkstra and Balanced/Fastest zero-heuristic A*, shared constraints and overlap labels; checked offshore routes; map/report stacking and dedicated SVG paths; centered dark map, world wrapping/minimum zoom; 33 static icons/lazy detail, 72-hour cap and removal of redundant navbar PDF. Intermediate fixed bounds and Google globe are no longer active.
