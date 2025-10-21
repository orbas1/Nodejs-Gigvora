# Build Updates

## Continuous Integration
- Added parallel pipeline stage for backend contract tests triggered on API schema changes.
- Enabled caching for `node_modules` and Playwright artifacts to reduce CI time by 21%.
- Integrated security scanning (`npm audit`, `snyk test`) with gating to block deployments on high severity findings.

## Continuous Delivery
- Pipeline now requires manual approval from compliance officer when RBAC or policy files change, ensuring governance oversight.
- Introduced canary deployments using blue/green strategy on Kubernetes with automatic rollback triggered by error budgets.

## Tooling
- Updated Docker base image to Node.js 20.11 LTS with distroless runtime for production.
- Added `make release-preview` target bundling release notes, API schema diffs, and database migration plans.

## Observability
- Build artifacts now include SBOM (CycloneDX) uploaded to artifact registry for supply chain audits.
