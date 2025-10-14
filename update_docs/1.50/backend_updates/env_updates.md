# Environment Updates — Version 1.50 Update

| Variable | Default | Purpose |
|----------|---------|---------|
| `REQUEST_BODY_LIMIT` | `1mb` | Caps JSON/urlencoded payloads to prevent oversized request abuse while still supporting bulk uploads when explicitly raised. |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Governs the rolling window (in ms) for the Express rate limiter guarding `/api/*` routes. |
| `RATE_LIMIT_MAX_REQUESTS` | `300` | Limits per-IP requests per window, balancing protection with standard SaaS usage patterns. |
| `LOG_LEVEL` | `info` | Controls verbosity of the new Pino logger shared by HTTP and worker processes. |
