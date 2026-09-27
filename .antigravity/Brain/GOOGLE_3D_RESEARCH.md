# Google 3D research — inactive design

Status reconciled 27 September 2026, source 5898e40. Active map: Leaflet/OpenStreetMap. GoogleEarthMap.jsx is an unmounted prototype; no active globe toggle or Google flat-map integration exists. The saved key is unused by PolarMap and must not be copied here.

The user returned to a flat map. Current behavior is a centered dark rectangle, horizontal wrapping, viewport-dependent minimum zoom, SVG routes and all 33 iceberg icons. See [implementation](CURRENT_IMPLEMENTATION.md).

Complete 26 September research and primary-source URLs are in the [archived Google research](archive/before-2026-09-27-reconciliation/GOOGLE_3D_RESEARCH.md). API/billing/coverage details were not freshly web-verified during this documentation pass and do not authorize service activation or cost.

If revived, check current official API documentation, permissions, attribution and geographic coverage. Test transitions, date-line geometry and all active layers. A geodesic display segment is not automatically identical to the validated backend lon/lat segment. Google imagery would be a basemap, not a marine routing or iceberg forecasting service.
