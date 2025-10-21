# Other Backend Updates

## Configuration
- Introduced environment variable `CORS_TRUSTED_ORIGINS` with per-environment overrides managed via parameter store.
- Added configuration validation step during bootstrap that halts startup if RBAC roles do not align with `shared-contracts` definitions.

## Logging & Monitoring
- Migrated structured logging format to ECS 1.12, allowing security teams to ingest logs directly into SIEM without transformation.
- Added new dashboards for queue latency and CORS rejection counts in Grafana folder `Backend/API Gateway`.

## Performance
- Tuned Node.js worker pool size to dynamic CPU-bound scheduling using `node:worker_threads` when heavy encryption tasks run, reducing p95 response times by 14% on compliance exports.
- Enabled HTTP/2 keep-alive with strict idle timeouts to improve concurrency without exhausting sockets.

## Documentation & Runbooks
- Updated `docs/runbooks/outage-playbook.md` to reference new alert names and mitigation steps.
- Added `docs/security/rbac-audit-checklist.md` guiding auditors through verifying permissions matrices.
