# Issue Report — Version 1.00 Pre-Update Evaluations

## Overview
The coordinated audits across backend, database, dependency, web, and mobile surfaces reveal a product that aspires to enterprise readiness yet stalls on foundational stability, security, and governance. Every platform layer contains duplicate bootstraps, conflicting configuration defaults, and unauthenticated control planes that let components advertise health while their dependencies crash or drift. The evaluations also expose large gaps between the stated roadmap—modular services, governed rollouts, cross-platform parity—and the code actually shipped, which remains monolithic and heavily manual.

## Backend Platform
### Stability and Runtime Safety
Backend startup executes the same worker warm-up twice (before and after database boot), so queues and schedulers can spawn duplicate consumers or crash during import when routers are redeclared. Errors within the worker loop are logged and suppressed, allowing the HTTP server to advertise readiness with a partially initialised async tier. Duplicate router mounts and merge-conflicted dependency guard toggles (`shouldBypassDependencyGuard` vs `isDependencyGuardDisabled`) create unpredictable routing aliases and oscillating health snapshots that undermine automation.

### Observability and Configuration Drift
Operational configuration is sourced directly from unvalidated environment variables, so typos produce silent fallbacks to insecure defaults. Health endpoints surface the same payload under multiple URLs without distinguishing readiness from dependency degradation, and `/health/metrics` streams Prometheus counters unauthenticated, letting attackers or curious tenants inspect internal load. Logging lacks correlation across background workers, and shutdown paths never reconcile which subsystems actually drained, leaving operators to guess during incidents.

### Security and Policy Alignment
Correlation IDs trust arbitrary `x-request-id` headers, Helmet leaves `unsafe-inline` in CSP, and unauthenticated metrics plus permissive error handlers leak stack traces through `err.details`. Migrations continue to create raw password columns even as product messaging touts secure-by-default auth. Taken together, the backend presents a fragile perimeter where spoofed headers, MITM against database connections, or stale dependency guards can silently degrade protections.

## Database Layer
### Schema Integrity
Core migrations omit unique constraints and indexes on personas, verification tokens, and linkage tables, inviting duplicate records and table scans under real traffic. OTP, audit, and session tables lack expirations or retention policies, so they grow unbounded and increase breach impact. Monetary fields use unconstrained `DECIMAL`, risking inconsistent rounding across environments, and JSON-backed settings expect PostgreSQL semantics even though production is locked to MySQL, leading to unindexed blob storage.

### Operational Safety
Bootstrap scripts never assert charset, collation, or SSL, so instances can deploy with mismatched encodings and plaintext connections. Migration batches run outside explicit transactions and do not roll back partial failure, meaning crashes strand half-created tables. Pool configuration parses raw environment values into Sequelize without validation, yielding `NaN` pool sizes and runtime crashes that only surface after deployment.

### Security and Governance
Passwords and two-factor tokens remain unhashed, and SSL enforcement can be disabled by typo. There is no production profile in `sequelize.config.cjs`, so operators misuse the development configuration in regulated environments. Observability emphasises readiness signals but ignores backup/restore automation, clashing with resilience expectations and leaving critical data without lifecycle oversight.

## Dependency Management
### Version and Toolchain Fragmentation
The monorepo pins conflicting `date-fns` versions, mixes native `fetch` with `node-fetch`, carries redundant logging stacks (`morgan` vs `pino-http`), and retains heavy SDKs (Mapbox, Agora) in the baseline bundle. Flutter packages rely on path dependencies and lack published artifacts, blocking external consumption. Lockfiles coexist with loose `^` ranges, confusing upgrade semantics and making reproducible builds dependent on whatever the last developer committed.

### Operational and Security Risks
Feature flags overlap (`DISABLE_RUNTIME_DEPENDENCY_GUARD` vs `DISABLE_DEPENDENCY_GUARD`), scripts import optional dependencies without guards, and mobile caches require Hive initialisation with no enforcement—leading to runtime explosions when consumers forget boot order. Web and mobile both store sensitive tokens using insecure primitives (`localStorage`, unencrypted Hive), yet no dependency introduces hardened storage solutions despite being readily available. Third-party SDKs arrive without matching procurement/config docs, increasing legal and security exposure.

## Front-end Application
### Routing and Navigation Debt
`App.jsx` defines routes in sprawling arrays and duplicate `<Route>` elements, so dashboards are registered multiple times, with whichever mount executes first winning. There is no 404 catch-all, role gates compare raw strings without normalisation, and fallback navigation loops users between login and protected dashboards without clearing stale state. Every dashboard is eagerly imported even before authentication, leaking taxonomy to unauthorised users and bloating initial bundle size.

### Client State and Error Handling
Session data persists in `localStorage` via homegrown serializers; JSON parse errors silently null out sessions, producing confusing spontaneous logouts. API client code assumes JSON responses, strips `Content-Type` headers on form submissions, and collapses backend errors into a generic “Request failed.” Without consistent state management, designers and QA cannot audit which membership tiers map to which routes or why the app silently recovers from corrupt storage by logging users out.

### Security Posture
Local storage tokens, client-derived `x-user-id` and `x-roles` headers, and unauthenticated preloading of admin dashboards combine to expose privilege hints and attack vectors. DOMPurify is embedded inline rather than via a hardened utility, so sanitiser updates can re-enable stored XSS in blog content. The SPA simultaneously requires cookies and `Authorization` headers, complicating CORS and doubling attack surface for credential theft.

## User Mobile App
### Bootstrap and Runtime Reliability
`GigvoraApp` watches multiple heavy `FutureProvider`s from the root widget, rerunning analytics, feature flags, runtime health, and push initialisation on every rebuild. Cold starts stall on blank screens while boot chains run serially, and analytics flushes clear unsent events whenever providers emit, erasing telemetry during hot reloads. Service locator singletons crash on hot restart because they are only configured once, blocking iterative development.

### State, Storage, and Error Handling
`SessionBootstrapResult` treats any refresh failure as expiry, clearing credentials during transient outages. `AuthTokenStore` swallows read/write errors and keeps tokens in unencrypted Hive boxes without device binding. Offline caches throw `StateError` if `init()` was missed, yet bootstrap never awaits initialisation. Theme providers hardcode “blue” without fallbacks, and snackbar queues overwhelm users during successive notifications, making recovery opaque.

### Security and Alignment
Runtime health is queried unauthenticated and trusted for maintenance messaging, enabling MITM suppression. Membership headers diverge from the web client’s format and are derived solely from cached state, so tampering can escalate privileges if the backend trusts them. Analytics, feature flags, and push onboarding operate without certificate pinning or user consent gating, conflicting with compliance expectations. The heavy provider scaffolding contradicts the roadmap desire for modular, partner-specific bundles.

## Cross-Cutting Misalignment
Port defaults disagree across clients (API on 5000 vs SPA 4000/4173/5173), membership headers vary (`x-roles` vs `X-Gigvora-*`), and observability focuses on readiness without runbooks or diagnostics for operators. Shared contracts are static JSON snapshots with no enforcement, so schemas evolve independently, and migrations still expect raw passwords despite security commitments. Dependency governance is ad hoc, there is no monorepo-wide release process, and optional enterprise features (Agora, Mapbox, push providers) ship without configuration, licensing, or rollout controls. Without a coordinated governance layer, every team ships features atop brittle foundations, risking outages, compliance breaches, and stalled partner integrations.
