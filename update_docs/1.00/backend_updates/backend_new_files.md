## New Backend Files

- `src/config/runtimeConfig.js` – schema-validated runtime configuration loader with hot reload support and config change events.
- `src/middleware/metricsAuth.js` – bearer-token guard for Prometheus metrics exposure.
- `scripts/validateRuntimeConfig.js` – CI/CLI helper validating `.env` files against the runtime configuration schema.
