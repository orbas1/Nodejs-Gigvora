# Version 1.00 – Build Updates

## Flutter Mobile CI/CD
- Introduced `.github/workflows/flutter_ci.yml` running on push/PR to `main`, `develop`, and release branches. The workflow provisions Flutter 3.19.6 with Temurin JDK 17, caches pub dependencies, bootstraps the Melos workspace, enforces analysis, executes unit/golden/integration suites, and uploads coverage artefacts for quality gates.
- Added a macOS build stage that depends on successful tests to produce Android App Bundles and unsigned iOS IPAs, publishing artefacts for QA consumption. Builds use the same melos bootstrap routine as local development to ensure dependency parity.
- Created `codemagic.yaml` defining the Gigvora Mobile Release workflow. Codemagic now runs the same analysis and test scripts, consumes shared signing credential groups, and ships release builds to Google Play Internal Testing and TestFlight through secure API keys.
- Standardised versioning by reading `APP_VERSION`/`BUILD_NUMBER` variables inside Codemagic, aligning build metadata with the programme increment cadence while avoiding manual bump errors.

## Operational Readiness
- Documented CI environment dependencies (Flutter, Java, Melos) in the pipeline so onboarding engineers inherit reproducible builds without additional scripting.
- Coverage artefacts from GitHub Actions are retained for SonarQube ingestion, enabling compliance with internal quality gates and telemetry dashboards.
