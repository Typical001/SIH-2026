# Route geometry fix — current disposition

Reconciled 27 September 2026. Original unchecked-fallback/land-endpoint work is superseded by the observation-backed runtime.

observed_routes.py validates endpoints, graph connections and final segments with route_geometry.py, Natural Earth land, projected USNIC shelves, estimated swept iceberg envelopes and vessel SIC limits. Presets resolve to offshore approaches. No successful unchecked straight line is returned. Invalid input gives 422; blocked searches 409; unavailable required data 503.

All five gateways/four stations remain choices; the offshore decision is resolved. Current regression covers all 20 default PC3 pairs. Stricter classes or larger envelopes can legitimately block a route. Frontend failure handling clears old geometry.

The original fixture engine and earlier 12/14-test milestones are historical. Their complete reasoning is retained in the [original fix record](archive/before-2026-09-27-reconciliation/DEMO_FIX_01.md). Use [implementation](CURRENT_IMPLEMENTATION.md), [presets](DEMO_PRESETS.md) and [testing](TESTING.md) for current evidence.
