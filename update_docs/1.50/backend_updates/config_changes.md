# Configuration Changes — Version 1.50 Update

- Added runtime toggles for request governance:
  - `REQUEST_BODY_LIMIT` (default `1mb`) controls Express JSON/urlencoded parser limits.
  - `RATE_LIMIT_WINDOW_MS` (default `60000`) defines the window for the global API rate limiter.
  - `RATE_LIMIT_MAX_REQUESTS` (default `300`) sets maximum requests per IP per window.
- Encouraged operators to define `LOG_LEVEL` to tune Pino logging verbosity across environments.
- The lifecycle supervisor now honours `PORT` but normalises the value before booting the HTTP server to avoid string/number mismatches.
