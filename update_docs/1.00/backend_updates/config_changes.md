## Configuration Changes

- Introduced `src/config/runtimeConfig.js` providing schema-validated runtime configuration with hot reload support, correlation ID policy, worker controls, and CSP defaults.
- Updated HTTP security middleware to source CSP and CORS rules from the runtime configuration, stripping `'unsafe-inline'` style allowances and aligning connect origins with the configured clients.
- Refactored `src/app.js` to pull rate limiting, request body limits, and logging toggles from the runtime configuration, allowing live updates without process restarts.
- Extended the runtime configuration schema with a `realtime` section covering namespace toggles, Redis clustering, connection limits, and heartbeat intervals, enabling operators to manage chat infrastructure without code changes.
- Added a `support.chatwoot` configuration block (base URL, website token, secure-mode HMAC, webhook secret, SLA thresholds) so widget provisioning and webhook ingestion can be managed from the runtime configuration with hot reload support.
- Updated `jest.config.js` to leverage `babel-jest` with explicit ESM-to-CJS transforms and disable implicit `.js` ESM inference so telemetry suites run without tripping the legacy model index, pairing with a new Babel preset.
