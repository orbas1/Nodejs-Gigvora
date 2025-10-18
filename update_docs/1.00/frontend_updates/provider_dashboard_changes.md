# Provider Dashboard Updates — Runtime Diagnostics

- Provider-facing dashboards (web) now surface a "Platform Status" widget powered by the same readiness endpoint as the admin
  console but scoped to provider-relevant services (booking pipelines, classroom sessions, payouts).
- Widget consumes `/health/ready?filter=queues` with provider-scoped tokens so partners can see queue latency affecting their
  workflows without exposing internal services.
- Added contextual alerts guiding providers to contact operations when outages affect scheduling or payouts.
