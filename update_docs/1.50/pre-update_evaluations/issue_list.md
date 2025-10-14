# Issue List – Version 1.50 Pre-Update Evaluations

1. Backend startup couples Express and worker lifecycles; failures inside `bootstrapOpportunitySearch` or background jobs prevent the API from serving traffic.
2. API routes lack schema validation, allowing malformed payloads and oversized bodies to propagate into Sequelize errors and silent data corruption.
3. Core workflows for payments, escrow, compliance, and notifications remain placeholders, leaving business-critical operations non-functional.
4. `src/models/index.js` concentrates thousands of lines of models and enums without modular separation, duplicating logic with `messagingModels.js` and blocking maintainability.
5. The global error handler in `src/middleware/errorHandler.js` omits the `next` argument, so Express skips centralized error serialization and leaves clients with hung requests or HTML responses.
6. Security controls remain inadequate: permissive CORS with credentials, plaintext OTP/reset tokens, over-shared session payloads, no rate limiting, and no audit logging.
7. Shared domain contracts are copy-pasted across backend, React, and Flutter codebases, creating inevitable schema drift and runtime incompatibilities.
8. Essential integrations (Stripe, Cloudflare R2, Agora, Mapbox) are either missing SDKs or only partially wired, so advertised capabilities cannot be exercised end-to-end.
9. Dependency governance is absent—no engine pinning, lockfile discipline, vulnerability scanning, or package automation—and `node_modules/` directories are committed to source while workspace tooling sits idle.
10. Browser and mobile builds lack required polyfills and platform shims for Mapbox, Agora, and other heavy SDKs, causing crashes outside the happy path.
11. Database migrations trail model definitions, omitting foreign keys, composite indexes, tenant identifiers, soft-delete/audit columns, and the warehouse tables referenced by analytics controllers.
12. SQLite-based tests rely on `sequelize.sync({ force: true })`, masking MySQL-specific failures and preventing reliable migration verification.
13. There is no documented data seeding, ERD, backup/recovery plan, or pool tuning, leaving QA environments incomplete and disaster recovery untested.
14. React routing duplicates public and protected paths in `App.jsx`, bypassing access guards, instantiating redundant provider wrappers, and bloating bundles with unreachable code.
15. Web dashboards render mock data through `useCachedResource` instead of real API calls; there is no React Query/SWR layer, error boundaries, or retry strategy.
16. Frontend usability foundations are missing—responsive design, accessibility, localization, and documentation for guard components are all incomplete.
17. Web build hygiene lags: tokens live in `localStorage`, bundle splitting is ignored, telemetry would leak PII, and landing pages such as `HomePage.jsx` hard-code marketing copy that requires code deploys to update.
18. Flutter app authentication is bypassed with a hard-coded admin JWT, duplicate service locator configuration, and mocked repositories, so the mobile client cannot perform real workflows.
19. Mobile navigation and guards in `app_router.dart` are brittle, with duplicated imports, inline role checks, ignored deep links, and static screens that fail under null sessions.
20. Mobile platform integrations—push notifications, analytics, secure storage, device posture checks—are stubs with no release automation, build flavour configuration, or resource cleanup.
21. Module boundaries and state initialization inside the Flutter app remain demo-focused, blending domain logic with UI and pre-populating caches with mock data that will overwrite production state.
22. Repository-wide observability, analytics, consent, and incident-response tooling is missing across all surfaces despite enterprise contractual promises.
23. Secrets management is ad hoc: `.env.example`, documentation, and source files ship demo JWTs and API keys without vault-backed alternatives, normalising insecure practices.
