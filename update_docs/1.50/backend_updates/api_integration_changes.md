# API Integration Changes — Version 1.50 Update

- Platform integrations, load balancers, and mobile clients must update health probes to call `GET /health/ready` to benefit from dependency-aware signals. Legacy `/health` continues to respond but now mirrors the readiness payload.
- Observability stacks should ingest the enriched readiness JSON (including worker roster and database latency) to power uptime dashboards referenced in the operations playbook.
- Internal tooling and admin dashboards can query `GET /api/domains/registry` and related endpoints to validate schema coverage, cross-check migration plans, and hydrate documentation portals with live metadata.
- Admin tooling, support dashboards, and mobile clients must integrate with `/api/runtime/maintenance` and `/api/admin/runtime/maintenance` to display downtime messaging. Ensure caching respects 60-second TTL and propagate `If-None-Match` headers for efficient polling.
