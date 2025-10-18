# Environment Template & Validation Updates

## `.env.template`
- Introduce a structured `.env.template` grouped by domain (`SERVER_*`, `DATABASE_*`, `SECURITY_*`, `INTEGRATION_*`). Each group
  is prefixed with comments documenting purpose, default, allowed values, and whether a secret manager entry is expected.
- Include production-safe defaults: `SERVER_PORT=8080`, `SERVER_HOST=0.0.0.0`, `RATE_LIMIT_WINDOW_MS=60000`, `RATE_LIMIT_MAX=1200`,
  `BODY_JSON_LIMIT=2mb`, `BODY_FORM_LIMIT=2mb`, `METRICS_SAMPLE_INTERVAL=15000`.
- Add explicit feature flags: `ENABLE_CHATWOOT`, `ENABLE_HUBSPOT`, `ENABLE_MEDIA_UPLOADS`. When set to `false`, the runtime
  configuration omits integration keys entirely, preventing partial initialisation.
- Provide environment parity toggles: `SYNC_DEPENDENCY_GUARD=true`, `QUEUE_CONCURRENCY=4`, `HTTP_SHUTDOWN_TIMEOUT_MS=45000`.

## Validation Script
- Add `scripts/validate-config.js` that loads `.env` files, merges them with defaults, and runs the Zod schema. It prints
  actionable error messages (variable name, expected type/range, remediation hint) and exits with non-zero status on failure.
- CI integrates the script in both GitHub Actions (`.github/workflows/api-ci.yml`) and Codemagic to block merges when templates
  drift or required keys are missing.

## Secrets Resolution Workflow
- Document the expectation that production secrets come from AWS Secrets Manager via `SECRETS_PROVIDER=aws`. The runtime config
  loader calls `secretsProvider.resolveSecret('database.primary.url')` if environment variables are missing.
- Provide local development fallbacks using `.env.local` which is ignored by Git to prevent accidental leakage.

## Operator Guidance
- `docs/operators/bootstrap.md` will include a checklist to validate configuration before deployment:
  1. Run `pnpm run validate:config --env=.env.staging`.
  2. Confirm the generated report shows `status: PASS` for all categories.
  3. Upload sanitized `.env.staging` to the secure configuration repository after encryption.
- The admin dashboard (see frontend updates) will surface whether the active environment was validated and the timestamp of the
  last successful run.
