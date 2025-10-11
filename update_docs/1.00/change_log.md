# Version 1.10 Update Change Log

- Removed all provider phone app artifacts (documentation, evaluations, tests, and UI assets) from the update package to reflect the retirement of the provider mobile experience.
- Established Flutter monorepo structure with shared foundation/design-system packages, GetIt-driven dependency injection, and a production-ready blue design token loader powering the mobile theme.
- Activated offline-first chat, feed, marketplace, and ads modules in the Flutter app, including optimistic queues, resilient cache hydration, and analytics instrumentation aligned with the backend contract tests.
- Integrated production GraphQL/data streaming clients, feature flag governance, and real-time feed streaming in the Flutter app to align mobile behaviour with the web routes and telemetry requirements.
- Wired secure token storage and session management through REST, GraphQL, and realtime gateways in the Flutter foundation, and introduced an auto-telemetry service emitting network/GraphQL/realtime metrics into the analytics pipeline for live dashboards.
- Established enterprise CI/CD with a GitHub Actions quality gate covering melos-driven analysis, unit/widget/golden/integration suites plus coverage uploads, and a Codemagic release workflow that produces signed Android App Bundles and iOS IPAs for beta distribution.
- Hardened the Node.js messaging backend with support-case aware inbox logic, HTTP controllers, and a support escalation migration, pairing Sequelize caching strategies with end-to-end Jest coverage for both service and REST flows.
- Stabilised discovery listings by introducing dialect-aware LIKE fallbacks, deterministic ordering, and defensive error handling so analytics dashboards and search clients receive consistent pagination metadata across SQLite and production databases.
