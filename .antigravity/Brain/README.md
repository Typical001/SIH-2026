# PolarNav project documentation

Reviewed: **2026-09-17** against committed `main` at **`dccfa3b`**, following `6097e6c` and `c996de7`. Application version: `1.0.0`. The working tree was clean before this documentation update.

PolarNav is a SIH 2026 demonstration for problem statement **26059**: Antarctic route planning and iceberg drift forecasting. React displays routes calculated by FastAPI using a static iceberg catalog, synthetic environmental fields, deterministic drift formulas and NetworkX A*.

**Current maturity: simulation prototype with reopened regressions.** UI safety labels, modeled savings, online indicators and explanations are not evidence of live feeds or validated navigation safety.

## Current status

- `c996de7` replaced the old controls/telemetry layout with `LeftControls`, `MapArea`, `DecisionSupport` and `BottomStatusBar`; added route explanations and a snapshot-based drift-speed chart.
- The same commit removed NAV-01 request guards, NAV-02 explicit no-route handling and NAV-06 honest error/empty states. All three issues are reopened.
- `dccfa3b` restored all eleven Brain documents and both regression-test files, byte-for-byte relative to `6097e6c`. It did not restore the corresponding application fixes, test script or test dependencies.
- Current verification: **3 original backend checks pass; production build passes; no-route suite fails during import; `npm.cmd test` fails because its script is absent.** No current claim of 22 passing checks is valid.
- A targeted in-process API probe with every grid cell blocked returned HTTP 200, 25 interpolated waypoints and LOW risk. Identical endpoints still produce `ZeroDivisionError`.
- The issue register contains **27 entries: 26 open (including 3 regressions), 1 retired because its manual-coordinate UI was removed**. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
- No browser, hosted deployment, fresh dependency installation or scientific validation was performed. The build used existing local dependencies; see [TESTING.md](TESTING.md).

## Documentation guide

| Document | Contents |
| --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Current features, removed controls, workflow and scope |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, data flow, drift/routing formulas and explanations |
| [API_REFERENCE.md](API_REFERENCE.md) | Endpoints, units, explanation schema and current failure behavior |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Windows setup, configuration, deployment and troubleshooting |
| [TESTING.md](TESTING.md) | Current results, historical results, diagnostics and coverage gaps |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Prioritized findings, regressions and acceptance criteria |
| [CHANGELOG.md](CHANGELOG.md) | Committed changes and this documentation-only update |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Main-only collaboration and change-record requirements |
| [FILE_INVENTORY.md](FILE_INVENTORY.md) | Current source roles, removed files and supporting artifacts |
| [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md) | Per-commit, per-file history through dccfa3b |

## Scope and paths

Documents live in `.antigravity/Brain`; the application root is `.antigravity` and the Git root is its parent. Source paths are application-root-relative unless explicitly marked otherwise.

All application-owned source, tests, configuration and existing Brain documents were read; JSON/lockfiles were inspected as data and dependency metadata. Physical files were inventoried across the entire application directory. Vendor runtimes, installed packages, Java extensions, executables and generated artifacts were categorized, not audited line by line or reverse engineered. This update modifies only the eleven Brain Markdown files; the build regenerated ignored `frontend/dist` output. No commit, push or deployment was performed.
