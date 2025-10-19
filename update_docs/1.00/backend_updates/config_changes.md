## Configuration Changes

- Introduced `src/config/runtimeConfig.js` providing schema-validated runtime configuration with hot reload support, correlation ID policy, worker controls, and CSP defaults.
- Updated HTTP security middleware to source CSP and CORS rules from the runtime configuration, stripping `'unsafe-inline'` style allowances and aligning connect origins with the configured clients.
- Refactored `src/app.js` to pull rate limiting, request body limits, and logging toggles from the runtime configuration, allowing live updates without process restarts.
