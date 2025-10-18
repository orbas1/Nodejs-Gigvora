# Issue List

1. Backend startup redeclares routers and double-runs worker warm-up, causing import-time crashes and letting background queues boot twice before readiness checks notice.
2. Runtime dependency guard flags (`DISABLE_RUNTIME_DEPENDENCY_GUARD` vs `DISABLE_DEPENDENCY_GUARD`) conflict, so health snapshots oscillate and automation cannot trust readiness signals.
3. Backend configuration depends on unvalidated environment variables; health and metrics endpoints remain unauthenticated and leak internal counters alongside permissive CSP and correlation ID handling.
4. Error handlers emit `err.details` and trust client-supplied `x-request-id`, exposing stack traces and enabling log poisoning while `/health/metrics` stays publicly readable.
5. Database migrations omit unique constraints, indexes, expirations, and retention for personas, OTP codes, audit logs, and linkage tables, risking data drift and runaway growth.
6. Schema bootstrap skips charset, collation, SSL, and transactional safety, so deployments diverge between environments and can strand half-created tables after failures.
7. Passwords and two-factor secrets are stored unhashed, and Sequelize lacks a production profile, leaving regulated deployments without hardened defaults.
8. Dependency manifests pin conflicting or redundant packages (`date-fns` v2 vs v4, `node-fetch` vs native `fetch`, `morgan` vs `pino-http`) and ship heavy SDKs without modularisation.
9. Lockfiles coexist with broad version ranges and optional dependencies imported without guards, producing brittle builds that fail unpredictably when modules are missing.
10. Flutter packages rely on path dependencies and Hive initialisation side effects, preventing external consumers from reusing libraries and triggering runtime `StateError` when boot order slips.
11. React router defines dashboards in duplicate arrays and JSX routes, lacks a 404 fallback, and performs eager imports before authentication, leaking product taxonomy and bloating bundles.
12. Frontend session management persists tokens in `localStorage`, swallows JSON parse errors, and collapses API failures into a generic message, creating confusing spontaneous logouts and poor diagnostics.
13. Frontend security posture relies on client-authored headers (`x-user-id`, `x-roles`) and inline DOMPurify usage, so any XSS or stale storage enables privilege escalation and stored content injection.
14. Web and backend disagree on API ports and credential strategies (cookies plus `Authorization`), leading to default integration failures and CORS friction.
15. Mobile bootstrap chains heavy providers serially on the root widget, re-running on every rebuild, blanking the screen during cold starts, and flushing analytics queues before they transmit.
16. Mobile session bootstrap treats transient network failures as token expiry, clears credentials, and stores auth tokens unencrypted in Hive without device binding or error reporting.
17. Service locator singletons and offline cache initialisation crash on hot restarts or parallel isolates, blocking iterative development and reliable automated testing.
18. Mobile membership headers diverge from the web format and are derived from cached client state without signatures, so backend middleware cannot rely on them for authoritative permissions.
19. Cross-platform observability lacks runbooks, consistent dependency guard reporting, and alignment between shared contract snapshots and evolving schemas.
20. Optional enterprise features (Agora, Mapbox, push notifications) ship without licensing, configuration, or rollout toggles, increasing compliance exposure and complicating staged launches.
21. Monorepo governance is absent: no workspace-wide dependency management, no release orchestration, and no schema/version discovery for external partners.
