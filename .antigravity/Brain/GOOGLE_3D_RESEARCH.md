# Google 3D globe research — 26 September 2026

Current status, reconciled 26 September 2026: the active map is Leaflet/OpenStreetMap. GoogleEarthMap.jsx is an unmounted prototype, with no active 3D toggle or integrated iceberg/layer controls. The saved Google key is not used by PolarMap, and the requested Google-backed flat map has not been implemented. Earlier visual inspection established globe rendering, not complete route transitions, geometry alignment or layer functionality. This document retains design research, not a claim of a completed Google integration.

Recent SVG route and report-overlay repairs apply to Leaflet. Its single-world boundary experiment was reverted after route-display problems; world wrapping is currently enabled. See CURRENT_IMPLEMENTATION.md and TESTING.md for current behavior. No key values are recorded here.

## Recommended integration

Use Google's supported 3D Maps in Maps JavaScript API (`maps3d`, `Map3DElement`). It provides the imagery renderer, camera interaction and custom overlays. This is a Google Maps Platform integration, not scraping or embedding the Google Earth consumer application.

Start with a globe-scale camera. Zoom toward the existing route with a smooth camera transition; progressively expose labels, iceberg positions, forecast tracks and buffers as the camera range decreases. Use a single renderer rather than switching between Leaflet and a separate globe at a zoom threshold. Preserve the full-window layout and planning panels.

The inactive prototype uses a globe camera range of 60,000 km and route camera range of 500 km, with a 55° tilt. Its geodesic Polyline3DElement and `3D Earth` / `Zoom to route` controls are not part of the active UI. A geodesic connection between waypoints is not necessarily identical to the backend's validated lon/lat segments.

The backend continues to calculate A* routes from our supplied observations, coastline and estimated hazard envelopes. Google supplies the visual basemap, not the maritime route or iceberg forecast. Render sufficiently densified coordinates following the backend's validated lon/lat segments; blindly replacing them with great-circle segments could change the visible path. Keep detailed iceberg overlays limited to the selected route/view, and avoid repeated viewer construction when inputs change.

## Findings and constraints

- Official API supports custom markers, polylines, camera range and range-change events.
- Google documents worldwide terrain coverage, while photorealistic surface meshes cover only selected areas. Do not promise detailed Antarctic meshes or current iceberg imagery. Antarctic performance and coverage need verification with an enabled key.
- Requires an appropriately configured Google Cloud project/API and browser key. A frontend key was subsequently saved locally; this documentation pass does not verify its service permissions or billing. No billing action was taken.
- Restrict the browser key to authorized HTTP referrers (including the exact local development origins) and required APIs. Frontend keys are visible to browsers; an environment file does not make them secret.
- Preserve required Google attribution and use the supported streaming service; do not build a downloaded Google Earth imagery archive.
- WebGL capability, globe/route transitions, route overlay alignment, the antimeridian, feature toggles and slow/failed loading require browser validation before replacing the working default.

Alternative: CesiumJS plus Google Photorealistic 3D Tiles offers more control, but requires more rendering and attribution integration. Prefer the native Google renderer initially for this React demo; do not introduce both stacks.

## Primary sources

- https://developers.google.com/maps/documentation/javascript/3d/overview
- https://developers.google.com/maps/documentation/javascript/3d/get-started
- https://developers.google.com/maps/documentation/javascript/3d/coverage
- https://developers.google.com/maps/documentation/javascript/reference/3d-map
- https://developers.google.com/maps/documentation/javascript/3d/shapes-lines
- https://developers.google.com/maps/documentation/javascript/usage-and-billing
- https://developers.google.com/maps/documentation/tile/usage-and-billing
- https://developers.google.com/maps/documentation/tile/policies
