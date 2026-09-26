> **Current-runtime update (26 September 2026):** See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md) for the observation-backed engine and estimation formulas, [RUNNING.md](RUNNING.md) for setup/start/stop, and [TESTING.md](TESTING.md) for current passing checks. Earlier runtime descriptions and test counts below are historical and superseded. No new Git commit is implied.

# Working preset passages — 2026-09-25

## Current replacement — 26 September 2026

The active preset engine is observed_routes.py, not demo_passages.py. Five gateway and four station choices are retained with offshore planning endpoints. Source observations replace simulated iceberg fixtures; calculated environment/drift assumptions remain disclosed. The latest backend acceptance checkpoint covers all 20 pairs with three default PC3 profiles, full segment validation and distinct objective checks. See [CURRENT_IMPLEMENTATION.md](CURRENT_IMPLEMENTATION.md).

Map endpoints come from the returned route metadata. SVG profiles remain separate from iceberg canvas rendering. The latest boundary revert restores wrapping and unconstrained horizontal navigation; Fit route was checked for the default passage, not every dateline crossing. Earlier fixture-era results below are historical.


The user authorized fixing the preset selections without further offshore-point
questions. All five gateways and four stations remain in the UI. Facility markers
retain their original coordinates; ships use explicitly labelled illustrative
offshore endpoints. Harbour entry and shore transfer legs are outside this demo.

## Implementation

`backend/demo_passages.py` supplies a local passage network sampled from offshore
approach chains and Southern Ocean corridors. Every network edge is checked against
the bundled Natural Earth coastline. Profile graphs exclude supplied simulated
iceberg forecast buffers and weight edges using simulated ice concentration. Final
route geometry is checked again. No failed search is converted to a straight line.
Network/profile graphs are cached by forecast horizon, buffer and profile; metrics
are recomputed for the selected vessel, speed and fuel. This is an illustrative
demo network, not a globally optimal or operational navigation service.

`POST /api/v1/calculate-route` resolves preset gateway/station IDs automatically.
Old frontend payloads containing exact facility-coordinate overrides also resolve.
Custom-coordinate requests retain the guarded graph engine. The frontend now sends
preset IDs, forecast horizon and buffer instead of overriding presets with on-land
coordinates. Map markers show the original facilities plus offshore departure and
arrival labels. A persistent simulated-demo notice is visible.

Preset calculations and `/api/v1/icebergs` use the same small local iceberg fixture
catalog and drift engine. These two paths do not fetch the live USNIC catalog.
Other auxiliary layers/health still have historical live-provider labels and
requests; completing their simulation conversion remains separate work.

## Validation

`python -m unittest test_demo_route_safety test_demo_presets -v`: **14 tests passed**,
including all **20 gateway/station pairs** (three validated profiles each) with
network access prohibited and SQLite startup writes redirected to a temporary DB.
Both API defaults and frontend-compatible preset requests were exercised.

Focused frontend tests: **17 passed**. Browser verification of the default Cape
Town → Bharati selection showed all three route choices, visible route geometry,
offshore labels, and the enabled compute button with no error/retry banner.

The earlier pending offshore-point decision in fix-01 notes is resolved by this
implementation. Vessel restriction calibration, metrics/report claims, auxiliary
data labels and complete offline startup remain on the broader demo backlog.
