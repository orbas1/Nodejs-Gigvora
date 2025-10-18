# Build & Deployment Updates — Platform Hardening

- Added `pnpm run validate:config` and `pnpm run test:lifecycle` steps to the API build pipeline. Builds now fail if readiness
  snapshots or configuration validation do not pass.
- Introduced `ops-token` secret management in CI; tokens are fetched from Vault and injected into test runs for authenticated
  health endpoint checks.
- Deployment scripts execute `scripts/publish-metrics-dashboard.js` post-deploy to sync observability dashboards with the current
  configuration version.
