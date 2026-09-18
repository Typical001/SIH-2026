# PolarNav project documentation

**Latest routing checkpoint — 2026-09-18:** local changes add validated inputs, checked segments/endpoints, directed search costs, consistent baseline geometry, signed fuel savings and explicit forecast coverage. UI fixes remain in place. See API_REFERENCE.md for contract additions and TESTING.md for verification. Model/coastline limitations remain documented in KNOWN_ISSUES.md; this is a simulation.

**UI checkpoint — 2026-09-18:** baseline `6d1f221` plus local visible-UI fixes. Horizon/endpoint labels, comparisons, alerts, risk colors, forecast layers and navigation shortcuts are corrected. See [CHANGELOG.md](CHANGELOG.md), [KNOWN_ISSUES.md](KNOWN_ISSUES.md) and [TESTING.md](TESTING.md) for changes and verification. Routing improvements were subsequently applied as described above. The September 17 snapshot below is historical.

Updated: **2026-09-17**. Committed baseline: **`3684d67`** on main; current working tree restores NAV-01/02/06 and frontend test infrastructure (uncommitted). Application version: `1.0.0`. The working tree was clean before these repairs.

PolarNav is a SIH 2026 demonstration for problem statement **26059**: Antarctic route planning and iceberg drift forecasting. React displays routes calculated by FastAPI using a static iceberg catalog, synthetic environmental fields, deterministic drift formulas and NetworkX A*.

**Current maturity: simulation prototype; the three request/error/no-route regressions are repaired locally.** UI safety labels, modeled savings, online indicators and explanations are not evidence of live feeds or validated navigation safety.

## Current status

- `c996de7` replaced the old controls/telemetry layout with `LeftControls`, `MapArea`, `DecisionSupport` and `BottomStatusBar`; added route explanations and a snapshot-based drift-speed chart.
- The same commit removed NAV-01 request guards, NAV-02 explicit no-route handling and NAV-06 honest error/empty states. All three are now repaired in the working tree while preserving the panel redesign and successful route explanations.
- `dccfa3b` restored all eleven Brain documents and both regression-test files, byte-for-byte relative to `6097e6c`. It did not restore the corresponding application fixes, test script or test dependencies.
- Current verification: **3 original backend checks, 5 no-route engine/ASGI tests and 20 frontend component tests pass (28 total); production build passes.** The frontend test script and pinned dependencies are restored.
- Blocked/missing graph paths now yield HTTP 409 / NO_ROUTE_FOUND with no geometry, metrics or explanations. The earlier false-success diagnostic is retained as history in TESTING. Identical-endpoint division by zero remains an open issue.
- The issue register contains **27 entries: 22 open, 4 fixed locally (NAV-01/02/06/24), 1 retired because its manual-coordinate UI was removed**. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
- DecisionSupport and Analytics show loading/empty states without fixture results; errors expose Retry. The footer displays simulation/result status and a UTC clock. Test dependencies were installed; no browser, hosted deployment, isolated clean-install or scientific validation was performed. See [TESTING.md](TESTING.md).

## Documentation guide

| Document | Contents |
| --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Current features, removed controls, workflow and scope |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, data flow, drift/routing formulas and explanations |
| [API_REFERENCE.md](API_REFERENCE.md) | Endpoints, units, explanation schema and current failure behavior |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Windows setup, configuration, deployment and troubleshooting |
| [TESTING.md](TESTING.md) | Current results, historical results, diagnostics and coverage gaps |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Prioritized findings, regressions and acceptance criteria |
| [CHANGELOG.md](CHANGELOG.md) | Committed changes and local restoration |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Main-only collaboration and change-record requirements |
| [FILE_INVENTORY.md](FILE_INVENTORY.md) | Current source roles, removed files and supporting artifacts |
| [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md) | Per-commit, per-file history through 3684d67 |

## Scope and paths

Documents live in `.antigravity/Brain`; the application root is `.antigravity` and the Git root is its parent. Source paths are application-root-relative unless explicitly marked otherwise.

All application-owned source, tests, configuration and existing Brain documents were read; JSON/lockfiles were inspected as data and dependency metadata. Physical files were inventoried across the entire application directory. Vendor runtimes, installed packages, Java extensions, executables and generated artifacts were categorized, not audited line by line or reverse engineered. The preceding full review was documentation-only; the current restoration changes application/test/package files and updates Brain. The build regenerated ignored `frontend/dist` output; exact paths are in CHANGELOG. No commit, push or deployment was performed.
