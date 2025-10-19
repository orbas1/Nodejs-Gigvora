## Build & CI Updates

- Added `npm run config:validate` to enforce runtime configuration schemas in CI pipelines before deployments.
- Documented operator runbook hooks to validate readiness endpoints and metrics authentication as part of deployment gating.
- Registered `npm run schema:export`, `npm run db:backup`, and `npm run db:verify` so CI and release managers can generate schema manifests, encrypted backups, and integrity reports on demand.
