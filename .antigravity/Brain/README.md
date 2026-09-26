# PolarNav project Brain

Updated 26 September 2026. PolarNav is a local observation-backed Antarctic passage-planning demo.

The active runtime uses 33 reported USNIC icebergs from the supplied PDF, checked against the official CSV; earlier BYU positions support drift estimation. Natural Earth land and USNIC ice shelves support geometry checks. Missing forecast, environmental and vessel data are calculated assumptions, explicitly labelled, as authorized by the user.

- [Current implementation and formulas](CURRENT_IMPLEMENTATION.md)
- [Run, stop and reset](RUNNING.md)
- [Test evidence](TESTING.md)
- [Issue status and remaining limitations](KNOWN_ISSUES.md)
- [API reference](API_REFERENCE.md)
- [Research data and provenance](../research/iceberg-data/README.md)

Recorded checks: 16 backend tests at the routing checkpoint and 27 frontend tests after the map-boundary revert. Production build passed before that final revert; it was not rerun afterward. The backend suite checks all 20 gateway/station pairs and every returned segment. This documentation update did not rerun tests.

Recent changes: independent SVG routes, isolated map/report stacking and non-bubbling route clicks. The single-world boundary experiment was reverted after a route-display regression; horizontal wrapping is restored and low-zoom repetition remains possible. The active map uses OpenStreetMap; the saved Google key is not used. See [Changelog](CHANGELOG.md), [Architecture](ARCHITECTURE.md) and [File inventory](FILE_INVENTORY.md).

Historical audit and fixture-era documents remain available, clearly labelled as superseded. They must not be used to describe the current runtime. No operational navigation certification is claimed.
