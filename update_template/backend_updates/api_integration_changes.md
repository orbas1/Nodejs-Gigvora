# API Integration Changes

| Integration | Update | Impact |
| --- | --- | --- |
| Mobile apps | Registered mobile bundle identifiers/domains in CORS allow-list and OAuth redirect URIs. | Enables secure auth handoffs without loosening perimeter controls. |
| Analytics pipeline | Tagged events with `surface` dimension and device hints. | Supports channel-level dashboards and anomaly detection. |
| Notification service | Webhook payloads include `triggeredBy` (`web`, `mobile`) attribute. | Downstream processors can tailor messaging cadence per channel. |
| Remote config | Added flags to orchestrate staged rollout of explorer filters and finance exports. | Allows rapid mitigation if metrics regress. |

All integrations revalidated against staging credentials; no credential rotation required.
