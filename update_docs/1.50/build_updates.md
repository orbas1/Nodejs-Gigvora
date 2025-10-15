# Build & Deployment Updates — Version 1.50

- Node backend start/stop scripts now expose `start()` and `stop()` helpers for test harnesses and operational tooling; production processes should monitor `/health/ready` before routing traffic.
- Container probes should be updated to call `GET /health/live` for liveness and `GET /health/ready` for readiness with a failure threshold aligned to worker bootstrap time (~15s).
- New environment variables (`REQUEST_BODY_LIMIT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `LOG_LEVEL`) should be injected through deployment manifests with environment-specific overrides.
- Configure WAF environment controls (`WAF_BLOCKED_IPS`, `WAF_BLOCKED_AGENTS`, `WAF_CUSTOM_RULES`, `WAF_DISABLED`) per environment so abuse mitigation can be tuned without redeploying the API.
- New automated quarantine tunables (`WAF_AUTO_BLOCK_THRESHOLD`, `WAF_AUTO_BLOCK_WINDOW_SECONDS`, `WAF_AUTO_BLOCK_TTL_SECONDS`, `WAF_AUTO_BLOCK_DISABLED`) must be defined per environment to balance false positives against response speed; document any overrides in runbooks.
- Logging pipelines must ingest structured JSON output from Pino; ensure log shippers parse the `requestId` and `worker` fields for correlation dashboards.
- Add `npm run schemas:sync` to CI to regenerate `shared-contracts/domain` artifacts whenever domain schemas evolve; distribute generated JSON to front-end and Flutter package registries as part of release automation.
- Introduce a companion CI step `npm run schemas:clients` so TypeScript definitions in `shared-contracts/clients/typescript` stay aligned with the JSON schema source of truth.
- Install the `compression` package for the Node API and ensure container images include the dependency so the new HTTP security middleware can emit compressed responses by default.
- Surface `TRUST_PROXY` configuration in deployment manifests (e.g., `loopback`, numeric hop counts) so Express recognises upstream load balancers when resolving client IPs and enforcing secure cookies.
- Apply `npx sequelize-cli db:migrate` during deployment to create `runtime_announcements`; missing table will cause new maintenance endpoints to fail with `500`.
- Update CI pipelines to run `npm test -- services/runtimeMaintenanceService` once optional dependencies (`zod`) are installed or stubbed to cover new lifecycle logic.
- Ship `docs/openapi/runtime-security.json` with backend release artifacts (e.g., attach to Docker image or publish to CDN) so client generators and partner tooling can pull the documented contract; cache headers expect a five-minute TTL with ETag validation.
- Add `npm test -- lifecycle/serverLifecycle` to CI smoke suites to verify the shutdown orchestrator continues draining pools and emitting audits after dependency changes.
- Add `npm test -- middleware/webApplicationFirewall` to CI smoke suites to ensure the web application firewall stays regression-safe.
- Introduce `npm test -- routes/securityPerimeter` to integration pipelines so middleware ordering, admin auth gates, and telemetry snapshots remain validated under the lightweight Express stack.
