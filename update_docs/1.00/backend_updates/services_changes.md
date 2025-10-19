## Services Changes

- Refactored `healthService` readiness reporting to paginate dependencies, expose worker telemetry (queue depth, aggregation heartbeat), and emit structured `ServiceUnavailableError` payloads for orchestration tooling.
- Added `getProfileEngagementQueueSnapshot` to surface pending, stuck, and failed job counts feeding the readiness API and operations dashboards.
- Enhanced the news aggregation service with execution telemetry (last run, last success, last error) to support health reporting and runbook diagnostics.
- Introduced `communityChatService` to orchestrate community thread provisioning, participant state, message persistence, moderation actions, and delivery acknowledgements for socket-driven chat workflows.
- Refined `channelRegistry` policies so role membership governs project operations access while maintaining privileged gates for moderation and provider namespaces.
