# Configuration Management Overhaul

## Overview
We are replacing the ad-hoc environment reads that currently live in `src/app.js`, `src/config/database.js`, and multiple
service helpers with a single runtime configuration module. The new module will:

- Validate all environment payloads using a composable Zod schema tree before the HTTP server boots.
- Provide strongly typed defaults for development, staging, and production via `config/runtimeConfig.js`.
- Expose a `/ops/config` admin endpoint that streams the computed configuration minus secrets, paginated for large sections.
- Support hot reloads for platform settings by diffing new values published by `platformSettingsService` and emitting
  lifecycle events that Express, worker pools, and feature toggles can subscribe to.

## Schema Definition
`src/config/runtimeConfig.js` will export `loadRuntimeConfig({ mode })` which:

1. Imports a `z.object` definition that covers the following sections:
   - **Server:** `port`, `host`, `enableCompression`, `corsAllowedOrigins`, `rateLimit.windowMs`, `rateLimit.max`,
     `bodyParser.jsonLimit`, `bodyParser.formLimit`.
   - **Database:** `url`, `dialect`, `pool.min`, `pool.max`, `pool.idle`, `ssl.required`, `ssl.ca`, `logging.level`.
   - **Security:** `csp`, `helmet`, `waf.enabled`, `requestId.enforceServerGenerated`, `dependencyGuard.bypassFlag`.
   - **Metrics & Observability:** `metrics.enabled`, `metrics.token`, `prometheus.sampleInterval`, `logSampling.rules`.
   - **Workers:** `queues`, `cron`, `maxConcurrency`, `gracefulShutdownTimeout`.
   - **Integrations:** `chatwoot`, `firebase`, `hubspot`, `cloudflareR2`, each with explicit keys for API URLs, tokens,
     and feature flags.
2. Reads a `.env` file via `dotenv` and merges it with environment-specific defaults stored in
   `config/defaults/{development|staging|production}.js`.
3. Validates the result. If validation fails, `loadRuntimeConfig` throws a `ConfigurationValidationError` that the bootstrap
   code catches to abort startup with a 503 readiness state.

All call sites (database lifecycle, rate limiting, CORS, worker manager) will import from this module rather than touching
`process.env` directly.

## Runtime Console & Hot Reload
- A new `ConfigConsoleController` will serve `/ops/config` (GET) and `/ops/config/reload` (POST) routes.
- `GET /ops/config` returns the current runtime configuration with sensitive keys masked. Query parameters
  allow filtering by section (`?section=database`).
- `POST /ops/config/reload` triggers `platformSettingsService.refresh()` which fetches the latest persisted settings,
  reruns schema validation, and emits a `config:reloaded` event on the `lifecycleEventBus`.
- Workers and Express middleware subscribe to `config:reloaded` to update caches (e.g., rate limit buckets) without restarts.

## Default Bundles and Secrets Handling
- `.env.template` will replace `.env.example` with comments documenting every variable, default values, and whether it is
  required. Sensitive defaults (API keys) are omitted and resolved through Vault/Secrets Manager at runtime.
- `config/secretsProvider.js` will expose an async `resolveSecret(key)` helper with in-memory caching and metrics instrumentation.

## Documentation & Tooling
- `docs/operators/configuration.md` will describe each section, expected ranges, and runbook steps for hot reloads.
- CI will call `node scripts/validate-config.js --env=.env.ci` during build to ensure submitted configuration files pass the schema.
