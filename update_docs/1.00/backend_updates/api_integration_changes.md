## API Integration Changes

- Connected the support stack to Chatwoot by introducing runtime-configured identity signing, REST session provisioning, and webhook ingestion so third-party conversations hydrate Gigvora support cases without manual intervention.
- Wired admin clients to the moderation REST surface, allowing dashboards to fetch queue/overview data and resolve events while maintaining SLA metadata and audit trails.
- Added live service telemetry ingestion to the admin runtime client, enabling dashboards to request cached or on-demand telemetry windows with configurable sampling durations.
- Refreshed the admin platform SDK to consume the enriched feature flag contract, automatically mapping access control metadata, guard-rail constraints, and environment rollout plans into the configuration UI while honouring RBAC and CORS guidance from the registry snapshot.
