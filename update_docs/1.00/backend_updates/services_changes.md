## Services Changes

- Refactored `healthService` readiness reporting to paginate dependencies, expose worker telemetry (queue depth, aggregation heartbeat), and emit structured `ServiceUnavailableError` payloads for orchestration tooling.
- Added `getProfileEngagementQueueSnapshot` to surface pending, stuck, and failed job counts feeding the readiness API and operations dashboards.
- Enhanced the news aggregation service with execution telemetry (last run, last success, last error) to support health reporting and runbook diagnostics.
- Introduced `communityChatService` to orchestrate community thread provisioning, participant state, message persistence, moderation actions, and delivery acknowledgements for socket-driven chat workflows.
- Refined `channelRegistry` policies so role membership governs project operations access while maintaining privileged gates for moderation and provider namespaces.
- Added `chatwootService` for authenticated widget provisioning, contact identity signing, webhook-driven thread mirroring, and SLA escalation that promotes support cases to urgent priority and queues notifications when thresholds are breached.
- Implemented `communityModerationService` to centralise heuristic scoring, moderation event persistence, queue aggregation, SLA escalation hooks, and admin resolution workflows with realtime notifications.
- Introduced `liveServiceTelemetryService` to aggregate timeline publishing, community chat throughput, inbox SLA health, event attendance, analytics recency, and runbook references with caching and high-volume sampling safeguards powering the admin observability dashboards.
- Enriched `featureFlagService` evaluation to respect assignment guard-rails, per-environment rollout policies, and RBAC-aware overrides sourced from the new schema so cross-platform clients receive deterministic results.
