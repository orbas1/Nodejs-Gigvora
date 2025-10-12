# Version 1.00 – Build Updates

## Flutter Mobile CI/CD
- Introduced `.github/workflows/flutter_ci.yml` running on push/PR to `main`, `develop`, and release branches. The workflow provisions Flutter 3.19.6 with Temurin JDK 17, caches pub dependencies, bootstraps the Melos workspace, enforces analysis, executes unit/golden/integration suites, and uploads coverage artefacts for quality gates.
- Added a macOS build stage that depends on successful tests to produce Android App Bundles and unsigned iOS IPAs, publishing artefacts for QA consumption. Builds use the same melos bootstrap routine as local development to ensure dependency parity.
- Created `codemagic.yaml` defining the Gigvora Mobile Release workflow. Codemagic now runs the same analysis and test scripts, consumes shared signing credential groups, and ships release builds to Google Play Internal Testing and TestFlight through secure API keys.
- Standardised versioning by reading `APP_VERSION`/`BUILD_NUMBER` variables inside Codemagic, aligning build metadata with the programme increment cadence while avoiding manual bump errors.

## Operational Readiness
- Documented CI environment dependencies (Flutter, Java, Melos) in the pipeline so onboarding engineers inherit reproducible builds without additional scripting.
- Coverage artefacts from GitHub Actions are retained for SonarQube ingestion, enabling compliance with internal quality gates and telemetry dashboards.

## Node.js Backend QA Hardening
- Updated the Sequelize SQLite configuration to bootstrap `tmp/` storage automatically and align pool settings with single-connection Jest usage, eliminating flakiness when running migration-backed suites locally or in CI.
- Added a backend-specific `.gitignore` to quarantine transient SQLite files, coverage output, and node modules so cross-team contributions do not accidentally commit artefacts created by the refreshed test harness.
- Wired supertest-backed controller suites into the Node.js backend pipeline, proving REST endpoints, caching, and support escalation flows behave consistently when exercised end-to-end.
- Introduced a `search:sync` CLI that authenticates to Meilisearch, provisions indexes, and batches Sequelize records into the search cluster so operations can schedule deterministic discovery ingestions in CI/CD.
- Bootstrapped the profile engagement worker inside `server.js` (skipped in tests) so likes/followers aggregation runs automatically in production while the new Jest suite (`profileEngagementService.test.js`) guards queue maths and metric persistence.
