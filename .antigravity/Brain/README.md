# PolarNav project Brain

Reconciled 27 September 2026 against source `5898e40` (captain login and public deployment). Brain is a manually reviewed snapshot, not an automatic synchronizer. Current documents replace contradictory intermediate descriptions; prior text is preserved in the [archive](archive/before-2026-09-27-reconciliation/README.md).

PolarNav is an observation-backed Antarctic passage-planning demo using 33 dated USNIC observations, earlier BYU reference positions, land/shelf geometry and explicitly calculated environmental, drift and vessel estimates. It runs locally and on Netlify/Render Free. Captain sign-in is required; there is no signup.

| Document | Purpose |
|---|---|
| [Overview](PROJECT_OVERVIEW.md) | Product, UI and scope |
| [Implementation](CURRENT_IMPLEMENTATION.md) | Data, algorithms, formulas and controls |
| [Architecture](ARCHITECTURE.md) | Connected components and request flow |
| [API](API_REFERENCE.md) | All active endpoints, access and errors |
| [Captain access](CAPTAIN_ACCESS.md) | Account/session behavior; no plaintext credentials |
| [Running](RUNNING.md) | Local setup, start, stop and reset |
| [Deployment](DEPLOYMENT.md) | Netlify/Render configuration and verified rollout |
| [Testing](TESTING.md) | Commands, dated results and limits |
| [Known issues](KNOWN_ISSUES.md) | Remaining work and resolved concerns |
| [Development](DEVELOPMENT.md) | Configuration and maintenance entry points |
| [Contributing](CONTRIBUTING.md) | Change-review/documentation workflow |
| [Inventory](FILE_INVENTORY.md) | Active, inactive and generated files |
| [Presets](DEMO_PRESETS.md) | Five gateways/four stations and offshore approaches |
| [Geometry fix](DEMO_FIX_01.md) | Current route validation and historical reasoning |
| [Changelog](CHANGELOG.md) | Verified changes |
| [Git history](GIT_CHANGE_HISTORY.md) | Actual commit metadata |
| [September 24 audit](AUDIT_2026-09-24.md) | Historical audit, superseded |
| [Google research](GOOGLE_3D_RESEARCH.md) | Inactive prototype and dated research |

Latest evidence: 35 frontend tests and production build passed; 14 observation/API and 3 authentication tests passed during the captain implementation. Four objective tests passed again during this reconciliation. These are separate runs totaling 21 backend tests. Live captain login, three default routes, 33 observations, sign-out and anonymous API rejection were verified on 27 September. See TESTING for scope.

Public site: https://polarnav-sih2026.netlify.app/ . API: https://polarnav-backend.onrender.com/ . No operational navigation certification or live AIS/satellite feed is claimed.
