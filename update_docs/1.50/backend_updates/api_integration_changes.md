# API Integration Changes — Version 1.50 Update

- Platform integrations, load balancers, and mobile clients must update health probes to call `GET /health/ready` to benefit from dependency-aware signals. Legacy `/health` continues to respond but now mirrors the readiness payload.
- Observability stacks should ingest the enriched readiness JSON (including worker roster and database latency) to power uptime dashboards referenced in the operations playbook.
