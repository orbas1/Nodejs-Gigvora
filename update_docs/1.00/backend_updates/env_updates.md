## Environment Configuration Updates

- Normalised backend defaults to port **4000** to align with the React client development target and avoid cross-environment drift.
- Introduced `REQUEST_BODY_LIMIT` to manage Express body-parser thresholds via the runtime configuration schema instead of ad-hoc environment checks.
- Added observability toggles: `ENABLE_HTTP_LOGGING`, `ENABLE_PROMETHEUS_METRICS`, and `METRICS_BEARER_TOKEN` (minimum 16 characters) to secure `/health/metrics`.
- Exposed worker governance flags (`ENABLE_BACKGROUND_WORKERS`, `ENABLE_PROFILE_ENGAGEMENT_WORKER`, `PROFILE_ENGAGEMENT_INTERVAL_MS`, `ENABLE_NEWS_AGGREGATION_WORKER`, `NEWS_AGGREGATION_INTERVAL_MS`) so operators can disable or tune workers without code changes.
- Added `RUNTIME_CONFIG_FILE` and `RUNTIME_CONFIG_HOT_RELOAD` switches to control schema-validated runtime configuration hot reloading.
