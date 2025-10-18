# Issue List — Version 1.00 Pre-Update Evaluations

1. HTTP bootstrap initialises database warm-up and background workers multiple times, spawning duplicate queues and schedulers.
2. Startup continues after dependency hydration failures, so instances advertise readiness while integrations remain offline.
3. Background worker orchestration catches and logs exceptions without surfacing stack traces to the HTTP layer.
4. Startup aborts do not unwind partially warmed services, leaving dependency guard caches running after failures.
5. Shutdown emits audit events before draining database pools, masking failed teardown attempts.
6. Router bundles redeclare modules (e.g., `creationStudioRoutes`), causing import-time syntax failures.
7. Identical routers mount under multiple prefixes, producing divergent API behaviour for the same resources.
8. `/health`, `/health/ready`, and `/health/metrics` return redundant payloads without dependency pagination.
9. Health reporting omits queue and worker status, leaving orchestration blind to background failures.
10. `/health/metrics` exposes Prometheus counters without authentication or throttling.
11. Runtime dependency guard listens to conflicting bypass flags, flipping cache state unpredictably.
12. Runtime dependency guard never throws the imported `ServiceUnavailableError`, hiding structured outage signals.
13. Background worker tracking stores stop callbacks in memory, assuming a single-instance deployment model.
14. Web application firewall dynamically imports audit helpers on the hot path, risking event-loop stalls during attacks.
15. Operational configuration is sourced directly from environment variables without schema validation or defaults.
16. Payload and rate limits are hard-coded in environment variables with no runtime visibility.
17. Platform settings cannot be reloaded without restarting the service.
18. Logging relies on a single `pino-http` transport while background workers fall back to `console` logging.
19. Correlation ID middleware trusts arbitrary `x-request-id` headers from clients.
20. Global error handler leaks `err.details` and request identifiers to API consumers.
21. CORS middleware returns opaque 403 responses without remediation guidance.
22. Request parsing enforces a blanket 1 MB cap without route-level overrides.
23. Express routes lack API versioning and deprecation headers for consumers.
24. Observability hooks emphasise metrics without accompanying runbooks or automated validation.
25. Dependency sync helpers still emit `console` output instead of structured logs.
26. Perimeter metrics helper accumulates unbounded in-memory state during prolonged attacks.
27. Backend default port (5000) conflicts with client expectations (4000), breaking local integration.
28. Database credentials, pool sizes, and SSL flags are ingested from unvalidated environment variables.
29. Helmet configuration retains `'unsafe-inline'`, leaving styles vulnerable to injection.
30. Optional enterprise integrations ship without licensing, consent, or rollout controls.
31. Core migrations omit unique constraints on persona tables, enabling duplicate user profiles.
32. Two-factor and OTP tables never expire tokens or enforce cleanup.
33. Monetary fields use unconstrained `DECIMAL`, risking precision drift across SQL dialects.
34. Later migrations depend on Postgres JSONB semantics despite production targeting MySQL.
35. Community and platform migrations add transactional tables without reporting projections, forcing analytics onto OLTP schemas.
36. Foreign keys lack `ON UPDATE` clauses, increasing the risk of orphaned references during schema changes.
37. Passwords and two-factor secrets remain plaintext in the schema.
38. Migration batches run outside explicit transactions, leaving partial schemas after failures.
39. Database lifecycle monitoring reports pools as “degraded” even after graceful shutdowns.
40. Bootstrap scripts skip charset and collation verification, allowing environment drift.
41. SSL enforcement downgrades to `rejectUnauthorized: false`, enabling MITM when operators expect strict checks.
42. Pool configuration parses integers without validation, permitting `NaN` pool sizes at runtime.
43. SQLite defaults for tests leave residual files that erode QA isolation.
44. No seed data or fixtures accompany migrations for onboarding or regression testing.
45. No schema snapshot or checksum exists for mobile cache validation.
46. Warm-up flows do not coordinate database connections with worker pools, risking contention on startup.
47. Runtime health metrics omit isolation level, replication role, and pool saturation details.
48. `sequelize.config.cjs` lacks a production profile, forcing reuse of development defaults.
49. Backup and restore automation is absent despite resilience requirements.
50. React app declares incompatible `date-fns` versions simultaneously.
51. Backend retains `node-fetch` despite native `fetch` support in Node 18+.
52. Backend ships both `pino-http` and `morgan`, duplicating logging stacks.
53. Backend scripts depend on CommonJS-only `fs-extra`, threatening future ESM compatibility.
54. Flutter modules mix GraphQL, REST, Hive caches, and design system packages without feature-flag modularisation.
55. Flutter app depends on relative-path design system packages, blocking consumption outside the monorepo.
56. Optional backend services import AI integrations without guarding missing dependencies.
57. Heavy SDKs (Mapbox, Agora, AWS, Meilisearch) land without feature flags, consent prompts, or licensing gates.
58. Package manifests use caret ranges while lockfiles are committed, confusing upgrade workflows.
59. Flutter workspace omits `pubspec.lock`, breaking build reproducibility.
60. Offline cache packages require manual `init()` calls with no enforcement, leading to runtime `StateError`.
61. Path dependencies cause `pub get` to fail when the design system package is unavailable.
62. React bundles `axios` even though the API client remains on `fetch`, fragmenting HTTP tooling.
63. Backend schema sync tooling depends on packages absent from frontend consumers, risking contract drift.
64. Membership headers diverge between web (`x-roles`, `x-user-id`) and mobile (`X-Gigvora-*`) clients.
65. Dependency guard toggles use conflicting environment variable names across services.
66. Vite dev server defaults (5173) collide with npm overrides (4173).
67. Dependencies such as `permission_handler` and `google_sign_in` require platform setup missing from the repo.
68. Shared contracts ship only static JSON snapshots without generation tooling.
69. DOMPurify is imported ad hoc instead of via a central hardened sanitisation helper.
70. Tokens persist in `localStorage` and Hive despite available secure storage libraries.
71. Hive caches store secrets without encryption or device binding.
72. `App.jsx` duplicates route definitions across metadata arrays and JSX, creating drift and unreachable screens.
73. Membership guards compare raw strings without case normalisation, causing false denials.
74. Router lacks a catch-all 404, so unknown URLs render blank screens.
75. Fallback routing sends unauthorised users to membership dashboards instead of safe defaults.
76. Base API URL defaults to port 4000, conflicting with backend port 5000.
77. API client strips `Content-Type` on multipart requests and assumes JSON responses.
78. API client collapses server errors into a generic “Request failed” message.
79. Session persistence relies on bespoke `localStorage` serializers that swallow parse errors.
80. Cookies and `Authorization` headers are used concurrently, duplicating authentication state.
81. Cached membership headers drift from backend-issued scopes and stale quickly.
82. Admin routes remain exposed despite missing backend RBAC scaffolding.
83. Front-end bundles eagerly import every dashboard and heavy SDK with no code-splitting strategy.
84. Storybook or component documentation is absent despite direct design-system consumption.
85. Base URL discovery lacks runtime feedback, leaving blank screens when configuration is missing.
86. Membership gates render privileged components before permission checks resolve, leaking taxonomy.
87. Custom headers (`x-user-id`, `x-roles`) are sourced from mutable client state, enabling tampering.
88. Bootstrap chains heavy `FutureProvider`s serially, blanking the Flutter UI during cold start.
89. Root widget re-watches bootstrap providers on rebuild, re-running expensive initialisation.
90. Analytics flush triggers on each provider watch, dropping events during reloads.
91. Service locator singletons crash on hot restart because they initialise only once per process.
92. Offline caches require manual `init()` that the bootstrap never awaits, causing runtime `StateError`.
93. `SessionBootstrapResult` clears tokens after transient refresh failures, forcing unnecessary logouts.
94. `AuthTokenStore` swallows storage errors and keeps credentials in Hive.
95. Hive-backed token storage lacks encryption and device binding, leaving secrets exposed.
96. Theme loader hardcodes a single palette with no fallback or user preference support.
97. Snackbars stack when multiple providers emit sequentially, overwhelming users.
98. Session bootstrapper returns success even when runtime health calls fail silently.
99. Runtime health queries fire unauthenticated before cached tokens load, doubling startup latency.
100. Push, analytics, and feature flag initialisation expose no readiness signals to the UI.
101. Service locator wiring prevents feature modules and tests from injecting doubles safely.
102. Mobile membership headers diverge from web format and lack localisation guidance for users.
103. Theme and bootstrap errors only log to `debugPrint`, leaving users without recovery paths.
104. Analytics, push, and feature flag initialisation lack certificate pinning.
105. Runtime health trusts unauthenticated responses, allowing attackers to suppress maintenance warnings.
106. Tokens copied from compromised devices remain valid elsewhere until expiry.
107. Feature flags, analytics, and push notifications are mandatory with no launch toggles for staged rollout.
108. Provider scaffolding assumes every feature is core, blocking modular deployments.
109. Design system path dependency drags the entire UI kit into mobile binaries, inflating size.
110. Riverpod provider defaults risk hitting live infrastructure during automated tests.
111. Ports, header names, and dependency guard toggles remain inconsistent across services, complicating environment setup.
112. Optional enterprise integrations lack cross-team governance for licensing, consent, and security.
113. Shared contracts and lifecycle tooling lack documentation, leaving teams without operational runbooks.
114. Background worker warm-up failures bubble up without contextual error codes, hindering automated restarts and triage.
115. Platform settings are consulted at startup but ship without operator tooling to validate or reload configuration safely.
116. The Express router aggregates every domain in one module, blocking service decomposition and complicating domain ownership.
117. Persona tables ship without supporting indexes on `email`, `userId`, or foreign keys, threatening performance at scale.
118. Two-factor secrets are stored unhashed alongside tokens, expanding the blast radius of any database leak.
119. There is no documented guidance or tooling for database encryption at rest, despite PII-heavy tables in core modules.
120. Migration filenames span numerous product domains without governance, signalling schema sprawl and coordination gaps.
121. Automated tests default to SQLite while production targets MySQL, masking dialect-specific bugs during QA runs.
122. Backend MySQL drivers evolve separately from the mobile app’s Hive caches, with no schema-sync process to keep models aligned.
123. Node and React packages operate outside a workspace, so dependency upgrades cannot be orchestrated centrally across the monorepo.
124. Platform-specific setup for mobile dependencies (`permission_handler`, `google_sign_in`) is undocumented, leading to runtime build failures.
125. Default service locator providers throw when overrides are missing, producing opaque crashes instead of onboarding guidance.
126. Maintenance and incident messaging is decoupled from the platform settings service, so the app cannot relay centralised notices.
