# PolarNav project documentation

Reviewed: 2026-09-14. Committed baseline: `da69f5f`; current behavior also includes uncommitted NAV-01, NAV-06 and NAV-02 fixes. Application version: `1.0.0`.

PolarNav is a SIH 2026 demonstration of Antarctic route planning and iceberg drift forecasting. The source identifies problem statement **26059**. A React dashboard displays routes computed by a Python FastAPI service using synthetic environmental data, a simplified drift model, and NetworkX A* search.

**Current maturity:** a simulation prototype. Satellite-feed labels, safety claims, and fuel savings shown by the interface are not evidence of validated live data or operational navigation safety. See the documented implementation gaps before presenting results.

## Current local status

- Fixed locally: request lifecycle (NAV-01), visible errors/empty results (NAV-06), and explicit no-route responses (NAV-02).
- Reverified during this documentation review: 3 original backend checks, 5 backend no-route checks, and 14 frontend component tests passed.
- Issue register: 23 entries, of which 3 are fixed locally and 20 remain open. A passing test suite is not proof of complete geographic or model correctness.
- Prototype deployment still needs clear simulation labels and an end-to-end hosted check. Deployment files remain configured for Python 3.10, while backend checks use the existing Python 3.14 environment.
- The historical Git snapshot excludes uncommitted work; the changelog records those local changes. No hosted deployment was verified in this review.

## Documentation guide

| Document | Contents |
| --- | --- |
| [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) | Purpose, capabilities, user workflow, dependencies and scope |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Components, data flow, drift and route calculations |
| [API_REFERENCE.md](API_REFERENCE.md) | Endpoints, parameters, payload fields and units |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Windows setup, configuration, deployment and troubleshooting |
| [TESTING.md](TESTING.md) | Existing tests, review results and missing coverage |
| [KNOWN_ISSUES.md](KNOWN_ISSUES.md) | Prioritized findings and proposed acceptance criteria |
| [CHANGELOG.md](CHANGELOG.md) | Verified history and additions/modifications/removals in this update |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to record every future codebase change |
| [FILE_INVENTORY.md](FILE_INVENTORY.md) | Application files and bundled/generated directory accounting |
| [GIT_CHANGE_HISTORY.md](GIT_CHANGE_HISTORY.md) | Per-commit, per-file changes for application-owned files |

These documents are stored in `.antigravity/Brain`. The application root is the parent `.antigravity` directory; the Git root is one level above the application root. Source paths and command working directories in these documents refer to the application root unless stated otherwise. Source/configuration files were read, Git history was inspected, and bundled tools were inventoried. Third-party dependencies, Java extensions, executables and generated output are classified as supporting artifacts; their internals have not received an application-code audit.

Start with [DEVELOPMENT.md](DEVELOPMENT.md) to run the project. Markdown change records require maintenance by contributors; they do not automatically monitor future edits.
