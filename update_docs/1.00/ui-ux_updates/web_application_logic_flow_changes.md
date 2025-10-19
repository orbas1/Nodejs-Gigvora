# Web Application Logic Flow Changes – Task 3

- Added role-switching logic and navigation mapping utilities (`resolvePrimaryNavigation`, `resolvePrimaryRoleKey`, `buildRoleOptions`) ensuring authenticated flows land on the correct dashboards before exposing timeline content.
- Embedded policy acknowledgement gating into the main layout to capture legal consent prior to interacting with messaging, studio, and financial modules.
- Updated engagement prompts and moderation errors to reference the Timeline, keeping copy and analytics consistent across all surfaces.
- Introduced a support entry flow that loads the Chatwoot widget post-login, signs the contact with runtime-configured metadata, and routes conversations into the dashboard inbox for SLA-tracked escalation.
- Added admin moderation flows that subscribe to realtime queue updates, support severity filtering, and capture resolution notes while dispatching actions back to the backend moderation service.
- Layered in a live service telemetry polling flow that periodically retrieves backend snapshots, merges them with runtime health data, and displays incident guidance plus runbook links without blocking other dashboard interactions.
